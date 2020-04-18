import React from 'react';

import Cookie from './utils/cookies';
import {
  firebaseApp,
  passCard,
  checkShow,
  startGame,
  createCard,
  leaveRoom,
} from './utils/firebase';

export default class Game extends React.Component {
  constructor(props) {
    super(props);
    this.cookie = new Cookie();
    this.state = {};
    this.db = firebaseApp.database();
  }

  safeBool(val) {
    if (val === true || val === 'true') return true;
    return false;
  }

  updateState(updates) {
    for (const key of Object.keys(updates)) {
      this.cookie.set(key, updates[key]);
    }
    this.setState(updates);
  }

  componentDidMount() {
    const roomId = this.cookie.get('roomId', '');
    const uid = this.cookie.get('uid', '');
    if (roomId) {
      this.db.ref(`rooms/${roomId}/gameStarted`).on('value', (snap) => {
        if (snap.exists()) this.setState({ gameStarted: snap.val() });
      });
      this.db
        .ref(`rooms/${roomId}/players/${uid}/isAdmin`)
        .on('value', (snap) => {
          if (snap.exists()) {
            const isAdmin = snap.val();
            this.cookie.set('isAdmin', isAdmin);
            this.props.setIsAdmin(isAdmin);
          }
        });
      this.db.ref(`rooms/${roomId}/players`).on('value', (snap) => {
        if (snap.exists()) {
          const players = snap.val();

          this.setState(
            {
              players,
            },
            () => {
              if (!players[uid]) {
                this.cookie.reset();
                this.cookie.set('uid', this.props.uid);
                this.props.leaveRoomClient();
              }
            }
          );
        }
      });
      this.db.ref(`rooms/${roomId}/gameData/${uid}`).on('value', (snap) => {
        if (snap.exists()) this.setState({ gameData: snap.val() });
      });
      this.db.ref(`rooms/${roomId}/gameData/passedCard`).on('value', (snap) => {
        if (snap.exists()) this.setState({ passedCard: snap.val() });
      });
      this.db.ref(`rooms/${roomId}/gameData/winner`).on('value', (snap) => {
        if (snap.exists()) this.setState({ winner: snap.val() });
      });
      this.db
        .ref(`rooms/${roomId}/gameData/previousTurn`)
        .on('value', (snap) => {
          if (snap.exists()) this.setState({ previousTurn: snap.val() });
        });
      this.db
        .ref(`rooms/${roomId}/gameData/currentTurn`)
        .on('value', (snap) => {
          if (snap.exists()) this.setState({ currentTurn: snap.val() });
        });
      this.db.ref(`rooms/${roomId}/gameData/nextTurn`).on('value', (snap) => {
        if (snap.exists()) this.setState({ nextTurn: snap.val() });
      });
      this.db.ref(`rooms/${roomId}/scores`).on('value', (snap) => {
        if (snap.exists()) this.setState({ scores: snap.val() });
      });
      this.db.ref(`rooms/${roomId}/cards`).on('value', (snap) => {
        if (snap.exists()) this.setState({ cards: snap.val() });
      });
      this.cookie.extendExpiryForAll();
    }
  }

  async startGame() {
    startGame({ roomId: this.props.roomId }).then(({ data }) => {
      if (typeof data === 'string') {
        this.setState({
          msg: data,
        });
      }
    });
  }

  async passCard() {
    if (!this.state.passClicked) {
      await this.setState({ passClicked: true });
      const passedIndex = this.state.passedIndex;
      passCard({
        roomId: this.props.roomId,
        cards: [...this.state.gameData.cards, this.state.passedCard].filter(
          Boolean
        ),
        passedIndex,
      }).then(() => this.setState({ passClicked: false }));
    }
  }

  async show() {
    if (!this.state.showClicked) {
      await this.setState({ showClicked: true });
      const cards = this.state.gameData.cards;
      checkShow({
        roomId: this.props.roomId,
        cards:
          this.state.currentTurn === this.props.uid
            ? [...cards, this.state.passedCard]
            : cards,
      }).then(({ data }) => {
        if (typeof data === 'string') {
          this.setState({ showClicked: false, msg: data }, () =>
            setTimeout(() => this.setState({ msg: '' }), 10000)
          );
        } else {
          if (this.props.uid === data.uid) {
            this.setState({ showClicked: false, privMsg: data.msg }, () =>
              setTimeout(() => this.setState({ privMsg: '' }), 10000)
            );
          }
        }
      });
    }
  }

  async kickUser(uid) {
    leaveRoom({ roomId: this.props.roomId, uid });
  }

  async updateCard() {
    createCard({ cardName: this.state.card, roomId: this.props.roomId });
    this.updateState({ cardName: this.state.card });
  }

  render() {
    return (
      <div className="flex flex-col w-screen h-screen">
        <div className="w-full grid justify-between">
          <div className="flex flex-col text-center mx-auto col-span-12">
            <h2>
              <b>Player Data</b>
            </h2>
            <ul>
              {this.state.players &&
                this.state.cards &&
                this.state.scores &&
                Object.keys(this.state.players).map((uid, index) => (
                  <li
                    key={index}
                    className="my-3 top-0 left-0 relative flex items-center"
                  >
                    <b>{this.state.players[uid].name}: </b>
                    {this.state.cardEditing && this.props.uid === uid ? (
                      <input
                        className="px-2 py-1 border-4 border-solid rounded-md"
                        style={{
                          borderColor:
                            this.state.cards[this.state.players[uid].card] ||
                            '#555',
                        }}
                        value={this.state.card}
                        onChange={(e) =>
                          this.setState({
                            card: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <span
                        className="px-2 py-1 border-4 border-solid rounded-md"
                        style={{
                          borderColor:
                            this.state.cards[this.state.players[uid].card] ||
                            '#555',
                        }}
                      >
                        {this.state.players[uid].card}
                      </span>
                    )}
                    <span className="mx-2 p-1 border-solid border-4 border-blue-300 rounded-md">
                      {this.state.scores[uid]} pts
                    </span>
                    {this.props.uid === uid ? (
                      this.state.cardEditing ? (
                        <button
                          id="saveButton"
                          onClick={() => {
                            this.updateCard();
                            this.setState({
                              cardEditing: false,
                            });
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                          </svg>
                        </button>
                      ) : (
                        <button
                          id="editButton"
                          className="baseline"
                          onClick={() =>
                            this.setState({
                              cardEditing: true,
                              card: this.state.players[uid].card,
                            })
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                      )
                    ) : (
                      <span></span>
                    )}
                    {this.safeBool(this.props.isAdmin) &&
                      uid !== this.props.uid && (
                        <button
                          className="ml-2"
                          uid={uid}
                          onClick={(e) =>
                            this.kickUser(e.currentTarget.getAttribute('uid'))
                          }
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                          </svg>
                        </button>
                      )}
                  </li>
                ))}
            </ul>
          </div>
          <div className="flex flex-col text-center mx-auto col-span-12">
            <h2>
              <b>Turn Order</b>
            </h2>
            <p>
              <span className="mx-2 border-solid border-green-300 border-b-2">
                {this.state.players &&
                  this.state.currentTurn &&
                  this.state.players[this.state.currentTurn].name}
              </span>
              <span>&#8594;</span>
              <span className="mx-2 border-solid border-yellow-300 border-b-2">
                {this.state.players &&
                  this.state.nextTurn &&
                  this.state.players[this.state.nextTurn].name}
              </span>
            </p>
          </div>
        </div>
        <div className="my-auto flex flex-col ">
          {[this.state.msg, this.state.privMsg].map(
            (msg) =>
              msg && (
                <div className="text-center py-4 lg:px-4 my-2">
                  <div
                    className="p-2 bg-blue-800 items-center text-blue-100 leading-none lg:rounded-full flex lg:inline-flex"
                    role="alert"
                  >
                    <span className="flex rounded-full bg-blue-500 uppercase px-2 py-1 text-xs font-bold mr-3">
                      INFO
                    </span>
                    <span className="font-semibold mr-2 text-left flex-auto">
                      {msg}
                    </span>
                    <svg
                      className="fill-current opacity-75 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M12.95 10.707l.707-.707L8 4.343 6.586 5.757 10.828 10l-4.242 4.243L8 15.657l4.95-4.95z" />
                    </svg>
                  </div>
                </div>
              )
          )}
          {this.state.winner &&
          this.state.players &&
          this.state.players[this.state.winner] ? (
            <h1 className="mx-auto font-bold text-xl">
              {this.state.players[this.state.winner].name} has won the game
            </h1>
          ) : (
            this.state.players &&
            this.state.currentTurn && (
              <React.Fragment>
                <b className="mx-auto">
                  {this.state.currentTurn === this.props.uid
                    ? this.state.previousTurn
                      ? `${
                          this.state.players[this.state.previousTurn].name
                        } has passed
                  a card`
                      : 'Pass a card to the next player'
                    : `Waiting for ${
                        this.state.players[this.state.currentTurn].name
                      } to pass
                  a card`}
                </b>
                {this.safeBool(this.state.gameStarted) && !this.state.winner && (
                  <button
                    className="h-20 w-20 flex flex-col items-center justify-center bg-white-500 hover:bg-green-100 text-black font-bold border-4 border-green-400 mt-4 mx-auto rounded-full"
                    onClick={() => this.show()}
                    disabled={this.state.showClicked || false}
                  >
                    <span>Show</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </button>
                )}
                <ul id="passed">
                  {this.state.currentTurn === this.props.uid &&
                    this.state.cards &&
                    this.state.passedCard && (
                      <li
                        onClick={() => {
                          this.setState({
                            passedIndex: this.state.gameData.cards.length,
                          });
                        }}
                      >
                        <p>
                          <span
                            className="top"
                            style={{
                              backgroundColor: this.state.cards[
                                this.state.passedCard
                              ],
                            }}
                          >
                            {this.state.passedCard}
                          </span>
                          <span className="mid">
                            {this.state.passedCard[0].toUpperCase()}
                          </span>
                          <span
                            className="bottom"
                            style={{
                              backgroundColor: this.state.cards[
                                this.state.passedCard
                              ],
                            }}
                          >
                            {this.state.passedCard}
                          </span>
                        </p>
                      </li>
                    )}
                </ul>
              </React.Fragment>
            )
          )}
          {this.safeBool(this.state.gameStarted) && (
            <ul id="hand">
              {this.state.gameData &&
                this.state.cards &&
                this.state.gameData.cards.map((card, index) => (
                  <li
                    key={index}
                    passedindex={index}
                    onClick={(e) => {
                      console.log(e);
                      this.setState({
                        passedIndex: e.currentTarget.getAttribute(
                          'passedindex'
                        ),
                      });
                    }}
                  >
                    <p>
                      <span
                        className="top"
                        style={{
                          backgroundColor: this.state.cards[card],
                        }}
                      >
                        {card}
                      </span>
                      <span className="mid">{card[0].toUpperCase()}</span>
                      <span
                        className="bottom"
                        style={{
                          backgroundColor: this.state.cards[card],
                        }}
                      >
                        {card}
                      </span>
                    </p>
                  </li>
                ))}
            </ul>
          )}
          <React.Fragment>
            {this.safeBool(this.state.gameStarted) ? (
              this.state.currentTurn === this.props.uid && (
                <p className="mx-auto mt-8">
                  {this.state.passedIndex
                    ? `You have selected `
                    : 'Select a card to pass on to next player!'}
                  <b>
                    {this.state.gameData &&
                      (this.state.passedIndex ===
                      this.state.gameData.cards.length
                        ? this.state.passedCard
                        : this.state.gameData.cards[this.state.passedIndex])}
                  </b>
                </p>
              )
            ) : (
              <p className="mx-auto mt-4">Waiting for admin to start game</p>
            )}

            {this.safeBool(this.state.gameStarted) && !this.state.winner && (
              <span className="flex flex-row items-center content-around my-8 mx-auto">
                {this.state.currentTurn === this.props.uid && (
                  <button
                    className="inline-flex bg-white-500 hover:bg-blue-100 text-black font-bold border-2 border-blue-400 py-2 px-6 rounded-full"
                    onClick={() => this.passCard()}
                  >
                    <span className="mr-2">Pass</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentcolor"
                        d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                      ></path>
                    </svg>
                  </button>
                )}
              </span>
            )}
          </React.Fragment>
          {!this.safeBool(this.state.gameStarted) &&
            this.safeBool(this.props.isAdmin) && (
              <button
                className="flex align-middle bg-white-500 hover:bg-white-700 text-black font-bold border-2 border-gary-400 py-1 px-4 mx-auto mt-8 rounded"
                onClick={() => this.startGame()}
              >
                {this.state.winner ? 'Play Again' : 'Start Game'}
              </button>
            )}
        </div>
      </div>
    );
  }
}
