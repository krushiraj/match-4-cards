import React from 'react';

import {
  firebaseApp,
  createRoom,
  joinRoom,
  createCard,
} from './utils/firebase';
import Cookie from './utils/cookies';
import Game from './Game';
import Lobby from './Lobby';
import Header from './Header';
import SignIn from './SignIn';
import CreateCard from './CreateCard';

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.cookie = new Cookie();
    this.db = firebaseApp.database();

    const cookieData = this.cookie.getAll();
    this.state = {
      joinRoom: false,
      ...cookieData,
    };
  }

  updateState(updates) {
    for (const key of Object.keys(updates)) {
      this.cookie.set(key, updates[key]);
    }
    this.setState(updates);
  }

  async signIn() {
    await this.props.signInWithGoogle();
  }

  async signOut() {
    await this.props.signOut();
    this.cookie.reset();
  }

  async joinOrCreateRoom() {
    const roomId = this.state.joinRoom
      ? this.state.roomId
      : Math.floor(100000 + Math.random() * 900000);
    if (this.state.joinRoom) {
      joinRoom({ roomId });
    } else {
      createRoom({ roomId });
    }
    this.updateState({ roomId, joined: true, isAdmin: !this.state.joinRoom });
  }

  async createCard() {
    const { card, roomId } = this.state;
    createCard({ cardName: card, roomId });
    this.updateState({ cardName: card });
  }

  isUserLoggedIn() {
    return this.props.user;
  }

  didUserJoinRoom() {
    return this.state.joined;
  }

  userCreatedCard() {
    return this.state.cardName;
  }

  renderAppByState() {
    if (this.isUserLoggedIn()) {
      if (this.didUserJoinRoom()) {
        if (this.userCreatedCard()) {
          return (
            <Game
              {...{
                ...this.props,
                ...this.state,
              }}
            />
          );
        } else {
          return (
            <CreateCard
              {...{
                ...this.props,
                ...this.state,
                setCardName: (val) => this.setState({ card: val }),
                createCard: this.createCard.bind(this),
              }}
            />
          );
        }
      } else {
        return (
          <Lobby
            {...{
              ...this.props,
              ...this.state,
              setJoinRoom: (val) => this.setState({ joinRoom: val }),
              setRoomId: (val) => this.updateState({ roomId: val }),
              joinOrCreateRoom: this.joinOrCreateRoom.bind(this),
            }}
          />
        );
      }
    } else {
      return <SignIn signIn={this.signIn.bind(this)} />;
    }
  }

  render() {
    return (
      <div className="w-screen h-screen flex flex-col my-auto mx-0">
        <Header
          {...{
            ...this.props,
            ...this.state,
            signOut: this.signOut.bind(this),
          }}
        />
        <div className="mx-auto my-auto w-full">{this.renderAppByState()}</div>
      </div>
    );
  }
}

export default Main;
