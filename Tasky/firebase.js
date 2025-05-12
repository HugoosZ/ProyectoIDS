import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // 👈 importar Firestore

const firebaseConfig = {
  apiKey: "AIzaSyDawiw9RbKSqAL03zVVo4LIOi-ggE01f8w",
  authDomain: "tasky-69b74.firebaseapp.com",
  projectId: "tasky-69b74",
  storageBucket: "tasky-69b74.firebasestorage.app",
  messagingSenderId: "1069303930447",
  appId: "1:1069303930447:web:c977ee712c5afcf5c9143a",
  measurementId: "G-0W7B1PMRD2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // 👈 inicializar Firestore

export { auth, db }; // 👈 exportar Firestore también
