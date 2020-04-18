import * as firebase from 'firebase';

export const config = {
  apiKey: 'AIzaSyCTUZFo-Zy_RkN78VJv5QVpVbf66_ee2y4',
  authDomain: 'match-4-cards.firebaseapp.com',
  databaseURL: 'https://match-4-cards.firebaseio.com',
  projectId: 'match-4-cards',
  storageBucket: 'match-4-cards.appspot.com',
  messagingSenderId: '769549667826',
  appId: '1:769549667826:web:5f4db641f4feee8b09af6b',
};

export const firebaseApp = firebase.initializeApp(config);
export const createRoom = firebase.functions().httpsCallable('createRoom');
export const joinRoom = firebase.functions().httpsCallable('joinRoom');
export const leaveRoom = firebase.functions().httpsCallable('leaveRoom');
export const createCard = firebase.functions().httpsCallable('createCard');
export const startGame = firebase.functions().httpsCallable('startGame');
export const stopGame = firebase.functions().httpsCallable('stopGame');
export const passCard = firebase.functions().httpsCallable('passCard');
export const checkShow = firebase.functions().httpsCallable('checkShow');
