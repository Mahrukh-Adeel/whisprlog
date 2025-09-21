import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from 'firebase/auth';

export const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const loginAnonymously = () => signInAnonymously(auth);