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

const getRandomColor = () => {
  var letters = '0123456789';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * letters.length)];
  }
  return color;
};

exports.createRoom = functions.https.onCall(
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
      await rooms.child(roomId).set({
        gameStarted: false,
        players: {
          [uid]: {
            name,
            admin: true,
          },
        },
        scores: {
          [uid]: 0,
        },
      });
    } catch (err) {
      return err;
    }
    return true;
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
          },
        });
      await rooms
        .child(roomId)
        .child('scores')
        .update({
          [uid]: 0,
        });
    } catch (err) {
      return err;
    }
    return true;
  }
);

exports.countPlayerChange = functions.database
  .ref('rooms/{roomId}/players/{playerId}')
  .onWrite(async (change) => {
    const playersRef = change.after.ref.parent;
    const countRef = playersRef.parent.child('playerCount');

    let increment;
    const playersData = (await playersRef.once('value')).val();
    console.log({ playersData });
    if (!playersData) return null;
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
    const messagesData = await playersRef.once('value');
    return messagesData.val()
      ? await counterRef.set(messagesData.numChildren())
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

    console.log({ playerCount, cardCount, check: playerCount === cardCount });

    if (playerCount < 3) {
      console.log('Returning as there are less than 3 players');
      return 'Minimum of 3 players required';
    }
    if (playerCount === cardCount) {
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
        gameData[turns[turnIndex]].cards = cards.splice(0, 4);
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
      return true;
    }

    console.log('All players didnot create cards yet');
    return 'All players have not created a card yet.';
  } catch (err) {
    return err;
  }
});

exports.passCard = functions.https.onCall(
  async ({ roomId, cards, passedIndex }, { auth: { uid } }) => {
    try {
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
    } catch (err) {
      return err;
    }
    return null;
  }
);

exports.checkShow = functions.https.onCall(
  async ({ roomId, cards }, { auth: { uid } }) => {
    try {
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
        if (cards.length === i) {
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
          await rooms.child(roomId).child('gameData').child('winner').set(uid);
          await rooms
            .child(roomId)
            .child('scores')
            .child(uid)
            .transaction((score) => score + (isSameCard ? 200 : 100));
          await rooms.child(roomId).child('gameStarted').set(false);
        } else {
          await rooms
            .child(roomId)
            .child('scores')
            .child(uid)
            .transaction((score) => score - 50);
        }
      }
    } catch (err) {
      return err;
    }
    return null;
  }
);
