import React from 'react';

import {
  firebaseApp,
  createRoom,
  joinRoom,
  createCard,
  leaveRoom,
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

    console.log(props);
    this.cookie = new Cookie();
    this.db = firebaseApp.database();

    const cookieData = this.cookie.getAll();
    this.state = {
      joinRoom: false,
      ...cookieData,
    };
  }

  safeBool(val) {
    if (val === true || val === 'true') return true;
    return false;
  }

  updateState(cookieUpdates, stateUpdates) {
    for (const key of Object.keys(cookieUpdates)) {
      this.cookie.set(key, cookieUpdates[key]);
    }
    this.setState({ ...cookieUpdates, ...stateUpdates });
  }

  async signIn() {
    await this.props.signInWithGoogle();
  }

  async signOut() {
    await this.props.signOut();
    this.cookie.reset();
    this.cookie.set('uid', this.props.uid);
    this.setState({ ...this.cookie.getAll() });
  }

  async joinOrCreateRoom() {
    let roomId = this.state.roomId;
    if (this.state.joinRoom) {
      joinRoom({ roomId });
    } else {
      roomId = (await createRoom()).data;
    }
    this.updateState({ roomId, joined: true, isAdmin: !this.state.joinRoom });
  }

  async leaveRoom() {
    const { roomId } = this.state;
    const { uid } = this.props;
    leaveRoom({ roomId, uid }).then(() =>
      this.updateState(
        { roomId: '', cardName: '', joined: false, isAdmin: false },
        { card: '' }
      )
    );
    this.forceUpdate();
  }

  async createCard() {
    const { card, roomId } = this.state;
    createCard({ cardName: card, roomId });
    this.updateState({ cardName: card });
  }

  isUserLoggedIn() {
    if (this.props.user) {
      console.log({
        isUserLoggedIn: !!this.props.user.uid,
        val: this.props.user.uid,
      });
      return !!this.props.user;
    }
    return false;
  }

  didUserJoinRoom() {
    console.log({
      didUserJoinRoom: this.safeBool(this.state.joined),
      val: this.state.joined,
    });
    return this.safeBool(this.state.joined);
  }

  userCreatedCard() {
    console.log({
      userCreatedCard: !!this.state.cardName,
      val: this.state.cardName,
    });
    return !!this.state.cardName;
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
                leaveRoomClient: () => {
                  this.updateState(
                    {
                      roomId: '',
                      cardName: '',
                      joined: false,
                      isAdmin: false,
                    },
                    { card: '' }
                  );
                },
                setIsAdmin: (val) => {
                  this.setState({ isAdmin: val });
                },
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
              setRoomId: (val) => this.setState({ roomId: val }),
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
            leaveRoom: this.leaveRoom.bind(this),
          }}
        />
        <div className="mx-auto my-auto w-full">{this.renderAppByState()}</div>
      </div>
    );
  }
}

export default Main;
