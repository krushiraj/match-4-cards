import React from 'react';

import Cookie from './utils/cookies';
import { firebaseApp, passCard, checkShow } from './utils/firebase';

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

  componentDidMount() {
    const roomId = this.cookie.get('roomId', null);
    const uid = this.cookie.get('uid', null);
    if (roomId) {
      this.db.ref(`rooms/${roomId}/gameStarted`).on('value', (snap) => {
        if (snap.exists()) this.setState({ gameStarted: snap.val() });
      });
      this.db.ref(`rooms/${roomId}/players`).on('value', (snap) => {
        if (snap.exists()) this.setState({ players: snap.val() });
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
    }
  }

  async passCard() {
    const passedIndex = this.state.passedIndex;
    passCard({
      roomId: this.props.roomId,
      cards: [...this.state.gameData.cards, this.state.passedCard].filter(
        Boolean
      ),
      passedIndex,
    });
  }

  async show() {
    const cards = this.state.gameData.cards;
    checkShow({
      roomId: this.props.roomId,
      cards: cards.length === 3 ? [...cards, this.state.passedCard] : cards,
    });
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
                  <li key={index} className="my-3 top-0 left-0 relative">
                    <b>{this.state.players[uid].name}: </b>
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
                    <span className="mx-2 p-1 border-solid border-4 border-blue-300 rounded-md">
                      {this.state.scores[uid]} pts
                    </span>
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
          {this.state.winner && this.state.players ? (
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
                        style={{ backgroundColor: this.state.cards[card] }}
                      >
                        {card}
                      </span>
                      <span className="mid">{card[0].toUpperCase()}</span>
                      <span
                        className="bottom"
                        style={{ backgroundColor: this.state.cards[card] }}
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
                <p className="mx-auto mt-4">
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
              <span className="flex flex-row items-center content-around mt-8 mx-auto">
                <button
                  className="align-middle bg-white-500 hover:bg-white-700 text-black font-bold border-2 border-green-400 py-1 px-4 mx-4 rounded"
                  onClick={() => this.show()}
                >
                  Show
                </button>
                {this.state.currentTurn === this.props.uid && (
                  <button
                    className="align-middle bg-white-500 hover:bg-white-700 text-black font-bold border-2 border-green-400 py-1 px-4 mx-4 rounded"
                    onClick={() => this.passCard()}
                  >
                    Pass
                  </button>
                )}
              </span>
            )}
          </React.Fragment>
          {!this.safeBool(this.state.gameStarted) &&
            this.safeBool(this.props.isAdmin) && (
              <button
                className="flex align-middle bg-white-500 hover:bg-white-700 text-black font-bold border-2 border-gary-400 py-1 px-4 mx-auto mt-8 rounded"
                onClick={() => this.props.startGame()}
              >
                {this.state.winner ? 'Play Again' : 'Start Game'}
              </button>
            )}
        </div>
      </div>
    );
  }
}
