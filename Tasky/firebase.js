// firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDawiw9RbKSqAL03zVVo4LIOi-ggE01f8w",
  authDomain: "tasky-69b74.firebaseapp.com",
  projectId: "tasky-69b74",
  storageBucket: "tasky-69b74.appspot.com", // ojo: tenías mal este dominio
  messagingSenderId: "1069303930447",
  appId: "1:1069303930447:web:c977ee712c5afcf5c9143a",
  measurementId: "G-0W7B1PMRD2"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Auth con persistencia
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
const db = getFirestore(app);

// Exports
export { auth, db };
