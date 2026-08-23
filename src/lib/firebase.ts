import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  where,
  limit,
  startAfter,
  QueryConstraint
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigData.projectId,
  appId: firebaseConfigData.appId,
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID if available
const firestoreDatabaseId = firebaseConfigData.firestoreDatabaseId;
export const db = firestoreDatabaseId && firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);

export { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  where,
  limit,
  startAfter,
  QueryConstraint
};
