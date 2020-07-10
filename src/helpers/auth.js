import { auth } from "../services/firebase";

export function signup(email, password) {
  return auth().createUserWithEmailAndPassword(email, password);
}

export function signin(email, password) {
  return auth().signInWithEmailAndPassword(email, password);
}

export function logout() {
  return auth().signOut();
}

export function getToken() {
  return auth().currentUser.getIdToken(/* forceRefresh */ true);
}

export async function signinToXkit() {
  const token = await getToken()
  window.xkit.login(token)
}
