const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.database();
const rooms = db.ref('rooms');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  console.log('Shuffled array:', array);
};

const safeBool = (val) => {
  if (val === true || val === 'true') return true;
  return false;
};

const getRandomColor = () => {
  const letters = 'FEDCBA98';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * letters.length)];
  }
  return color;
};

exports.createRoom = functions.https.onCall(
  async (
    data,
    {
      auth: {
        uid,
        token: { name },
      },
    }
  ) => {
    const getRoom = async (roomId) =>
      (await rooms.child(roomId).once('value')).val();
    try {
      let roomId;
      let exists = true;
      do {
        roomId = Math.floor(100000 + Math.random() * 900000);
        // eslint-disable-next-line no-await-in-loop
        exists = await getRoom(roomId);
        console.log({ roomId, exists });
      } while (exists);
      console.log({
        roomId,
        uid,
        name,
      });
      await rooms.child(roomId).set({
        timestamp: Date.now(),
        gameStarted: false,
        players: {
          [uid]: {
            name,
            isAdmin: true,
          },
        },
        scores: {
          [uid]: 0,
        },
      });
      return roomId;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
);

exports.joinRoom = functions.https.onCall(
  async (
    { roomId },
    {
      auth: {
        uid,
        token: { name },
      },
    }
  ) => {
    try {
      console.log({
        roomId,
        uid,
        name,
      });
      await rooms
        .child(roomId)
        .child('players')
        .update({
          [uid]: {
            name,
            isAdmin: false,
          },
        });
      await rooms
        .child(roomId)
        .child('scores')
        .update({
          [uid]: 0,
        });
      await rooms.child(roomId).child('timestamp').set(Date.now());
    } catch (err) {
      console.log(err);
      return err;
    }
    return true;
  }
);

exports.leaveRoom = functions.https.onCall(async ({ roomId, uid }) => {
  try {
    console.log({
      roomId,
      uid,
    });
    const playerData = (
      await rooms.child(roomId).child('players').once('value')
    ).val();
    const count = Object.keys(playerData).length;
    console.log({
      playerData,
      isAdmin: playerData[uid] && playerData[uid].isAdmin,
      condition:
        playerData[uid] &&
        safeBool(playerData[uid].isAdmin) === true &&
        count > 1,
      count,
    });
    if (safeBool(playerData[uid].isAdmin) === true && count > 1) {
      const adminId = Object.keys(playerData).filter((id) => id !== uid)[0];
      await rooms.child(roomId).child('players').child(adminId).update({
        isAdmin: true,
      });
      console.log({ adminId });
    }
    console.log('Deleting all data');
    await rooms.child(roomId).child('gameStarted').set(false);
    await rooms.child(roomId).child('players').child(uid).remove();
    await rooms.child(roomId).child('gameData').child(uid).remove();
    await rooms.child(roomId).child('scores').child(uid).remove();
    await rooms.child(roomId).child('timestamp').set(Date.now());
  } catch (err) {
    console.log(err);
    return err;
  }
  return true;
});

/**
 * Deletes all inactive rooms.
 */
exports.deleteInactiveRooms = functions.database
  .ref('rooms')
  .onWrite(async (change) => {
    const now = Date.now();
    const cutoff = now - 30 * 60 * 1000;

    const oldItemsQuery = rooms.orderByChild('timestamp').endAt(cutoff);
    return oldItemsQuery.once('value', (snapshot) => {
      // create a map with all children that need to be removed
      const updates = {};
      snapshot.forEach((child) => {
        updates[child.key] = null;
      });
      // execute all updates in one go and return the result to end the function
      return rooms.update(updates);
    });
  });

exports.countPlayerChange = functions.database
  .ref('rooms/{roomId}/players/{playerId}')
  .onWrite(async (change) => {
    const playersRef = change.after.ref.parent;
    const countRef = playersRef.parent.child('playerCount');

    let increment;
    const playersData = (await playersRef.once('value')).val();
    console.log({ playersData });
    if (!playersData) {
      return null;
    }
    if (change.after.exists() && !change.before.exists()) {
      increment = 1;
    } else if (!change.after.exists() && change.before.exists()) {
      increment = -1;
    } else {
      return null;
    }
    // Return the promise from countRef.transaction() so our function
    // waits for this async event to complete before it exits.
    await countRef.transaction((current) => {
      console.log({ increment, current });

      const result = (current || 0) + increment;
      return result < 0 ? 0 : result;
    });
    return null;
  });

exports.recountPlayers = functions.database
  .ref('rooms/{roomId}/playerCount')
  .onDelete(async (snap) => {
    const counterRef = snap.ref;
    const playersRef = counterRef.parent.child('players');

    // Return the promise from counterRef.set() so our function
    // waits for this async event to complete before it exits.
    const playersData = await playersRef.once('value');
    return playersData.val()
      ? await counterRef.set(playersData.numChildren())
      : null;
  });

exports.countCardChange = functions.database
  .ref('rooms/{roomId}/players/{playerId}/card')
  .onWrite(async (change) => {
    const roomRef = change.after.ref.parent.parent.parent;
    const countRef = roomRef.child('cardCount');

    const playersData = (await roomRef.child('players').once('value')).val();
    console.log({ playersData });
    if (!playersData) return null;
    let increment = 0;
    if (change.after.exists() && !change.before.exists()) {
      increment = 1;
    } else if (!change.after.exists() && change.before.exists()) {
      increment = -1;
    }

    const afterVal = change.after.val();
    const beforeVal = change.before.val();
    const color = getRandomColor();

    console.log({ afterVal, beforeVal, color });
    if (afterVal) await roomRef.child('cards').child(afterVal).set(color);
    if (beforeVal) await roomRef.child('cards').child(beforeVal).set(null);

    // Return the promise from countRef.transaction() so our function
    // waits for this async event to complete before it exits.
    await countRef.transaction((current) => {
      console.log({ increment, current });
      const result = (current || 0) + increment;
      return result < 0 ? 0 : result;
    });
    return null;
  });

exports.recountCards = functions.database
  .ref('rooms/{roomId}/cardCount')
  .onDelete(async (snap) => {
    const counterRef = snap.ref;
    const playersRef = counterRef.parent.child('players');

    // Return the promise from counterRef.set() so our function
    // waits for this async event to complete before it exits.
    const playersData = (await playersRef.once('value')).val();
    if (playersData) {
      let count = 0;
      for (const key in playersData) {
        if (playersData[key].card) count += 1;
      }
      return await counterRef.set(count);
    }
    return null;
  });

exports.createCard = functions.https.onCall(
  async ({ cardName, roomId }, { auth: { uid } }) => {
    try {
      await rooms
        .child(roomId)
        .child('players')
        .child(uid)
        .child('card')
        .set(cardName);
      console.log({ roomId, cardName });
      rooms.child(roomId).child('timestamp').set(Date.now());
    } catch (err) {
      return err;
    }
    return true;
  }
);

exports.startGame = functions.https.onCall(async ({ roomId }, context) => {
  try {
    const playerCount = (
      await rooms.child(roomId).child('playerCount').once('value')
    ).val();
    const cardCount = (
      await rooms.child(roomId).child('cardCount').once('value')
    ).val();
    const uniqueCardCount = Object.keys(
      (await rooms.child(roomId).child('cards').once('value')).val()
    ).length;

    console.log({ playerCount, cardCount, check: playerCount === cardCount });

    if (playerCount < 3) {
      console.log('Returning as there are less than 3 players');
      const msg = 'Minimum of 3 players required';
      await rooms.child(roomId).child('msg').set(msg);
      return msg;
    }
    if (playerCount === cardCount && cardCount === uniqueCardCount) {
      console.log('Fetching players data');
      const playersData = (
        await rooms.child(roomId).child('players').once('value')
      ).val();
      console.log('Players data fetched:', { playersData });

      let cards = [];
      const gameData = {};
      const turns = [];
      for (const key in playersData) {
        cards.push(playersData[key].card);
        gameData[key] = {};
        turns.push(key);
      }
      cards = cards.concat(cards);
      cards = cards.concat(cards);
      shuffleArray(cards);
      shuffleArray(cards);
      shuffleArray(turns);

      console.log({ cards, turns });

      for (const turnIndex in turns) {
        gameData[turns[turnIndex]].cards = cards.splice(0, 4).sort();
      }
      gameData.previousTurn = false;
      gameData.currentTurn = turns[0];
      gameData.nextTurn = turns[1];
      gameData.turnCount = 0;
      gameData.winner = false;
      gameData.passedCard = false;

      console.log({ gameData });

      await rooms.child(roomId).child('turns').set(turns);
      await rooms.child(roomId).child('gameData').set(gameData);
      await rooms.child(roomId).child('gameStarted').set(true);
      rooms.child(roomId).child('timestamp').set(Date.now());

      return true;
    }

    const msg =
      cardCount === uniqueCardCount
        ? 'All players didnot create cards yet'
        : 'All cards must be unique. All players with same card must edit card name. One player can just hit edit and save to have the same card name';
    console.log(msg);
    await rooms.child(roomId).child('msg').set(msg);
    return msg;
  } catch (err) {
    console.log(err);
    return err;
  }
});

exports.passCard = functions.https.onCall(
  async ({ roomId, cards, passedIndex }, { auth: { uid } }) => {
    try {
      const lastPassClicked = (
        await rooms
          .child(roomId)
          .child('gameData')
          .child('lastPassClicked')
          .once('value')
      ).val();
      if (lastPassClicked !== uid) {
        console.log({ passedIndex, cards });
        const turnCount =
          (
            await rooms
              .child(roomId)
              .child('gameData')
              .child('turnCount')
              .once('value')
          ).val() + 1;
        const turns = (
          await rooms.child(roomId).child('turns').once('value')
        ).val();
        const playerCount = (
          await rooms.child(roomId).child('playerCount').once('value')
        ).val();
        const passedCard = cards.splice(passedIndex, 1)[0];
        cards.sort();

        console.log({
          turnCount,
          turns,
          playerCount,
          passedCard,
          cards,
          previousTurn: turns[(turnCount - 1) % playerCount],
          currentTurn: turns[turnCount % playerCount],
          nextTurn: turns[(turnCount + 1) % playerCount],
        });

        let i;
        await rooms
          .child(roomId)
          .child('gameData')
          .child(uid)
          .child('cards')
          .set(cards);
        await rooms
          .child(roomId)
          .child('gameData')
          .update({
            passedCard,
            turnCount,
            previousTurn: turns[(turnCount - 1) % playerCount],
            currentTurn: turns[turnCount % playerCount],
            nextTurn: turns[(turnCount + 1) % playerCount],
          });
        rooms.child(roomId).child('timestamp').set(Date.now());
      }
    } catch (err) {
      console.log(err);
      return err;
    }
    return null;
  }
);

exports.checkShow = functions.https.onCall(
  async ({ roomId, cards }, { auth: { uid } }) => {
    try {
      let msg;
      const lastShowClicked = (
        await rooms
          .child(roomId)
          .child('gameData')
          .child('lastShowClicked')
          .once('value')
      ).val();
      if (lastShowClicked !== uid) {
        const winner = (
          await rooms
            .child(roomId)
            .child('gameData')
            .child('winner')
            .once('value')
        ).val();

        console.log({ winner });

        if (!winner) {
          console.log({ cards });

          let i;
          for (i = 0; i < cards.length && cards[i] === cards[0]; i += 1);
          if (i === 4) {
            console.log('Setting winner:', uid);
            const isSameCard =
              (
                await rooms
                  .child(roomId)
                  .child('players')
                  .child(uid)
                  .child('card')
                  .once('value')
              ).val() === cards[0];
            await rooms
              .child(roomId)
              .child('gameData')
              .child('winner')
              .set(uid);
            await rooms
              .child(roomId)
              .child('scores')
              .child(uid)
              .transaction((score) => score + (isSameCard ? 200 : 100));
            await rooms.child(roomId).child('gameStarted').set(false);
            msg = { uid, msg: 'You won!' };
          } else {
            await rooms
              .child(roomId)
              .child('scores')
              .child(uid)
              .transaction((score) => score - 50);
            msg = {
              uid,
              msg:
                cards.length === 5
                  ? 'You should have only 4 cards before hitting show. Pass card and hit show.'
                  : `You have [${cards}]. Please check again before hitting show.`,
            };
          }
        }
        rooms.child(roomId).child('timestamp').set(Date.now());
        await rooms.child(roomId).child('msg').set(msg);
      } else {
        msg = {
          uid,
          msg:
            'You have already checked for SHOW but you do not have 4 same cards.',
        };
      }
      await rooms
        .child(roomId)
        .child('gameData')
        .child('lastShowClicked')
        .set(uid);
      return msg;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
);
