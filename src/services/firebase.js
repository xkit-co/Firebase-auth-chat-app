import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
const config = {
  apiKey: "AIzaSyCx8wda2Cw6Qryp3wwRh-mUiVAX0NnqooQ",
  authDomain: "chatty-xkit.firebaseapp.com",
  databaseURL: "https://chatty-xkit.firebaseio.com"
};

firebase.initializeApp(config);

export const auth = firebase.auth;
export const db = firebase.database();
