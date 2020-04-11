import React, { Component } from 'react';
import withFirebaseAuth from 'react-with-firebase-auth';
import firebase from 'firebase';
import 'firebase/auth';

import { firebaseApp } from './utils/firebase';
// import logo from './logo.svg';
import Main from './Main';
import Cookie from './utils/cookies';

const firebaseAppAuth = firebaseApp.auth();
const providers = {
  googleProvider: new firebase.auth.GoogleAuthProvider(),
};

class App extends Component {
  constructor(props) {
    super(props);

    this.cookie = new Cookie();
  }

  componentDidUpdate() {
    if (this.props.user) this.cookie.set('uid', this.props.user.uid);
  }

  render() {
    return (
      <div>
        <Main {...this.props} />
      </div>
    );
  }
}

export default withFirebaseAuth({
  providers,
  firebaseAppAuth,
})(App);
