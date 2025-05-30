//Aquí está la lógica para conectarnos a Firebase  

require('dotenv').config();
//require('dotenv').config({ path: './db.env'});
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');


// 1. Parsear y asignar correctamente las credenciales
const firebaseCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);

// 2. Inicializar Firebase con las credenciales
const firebaseApp = initializeApp({
    credential: cert(firebaseCredentials) // Usar la variable ya definida
});

// 3. Obtener Firestore
const db = getFirestore();
const auth = getAuth();

module.exports = { db, auth };
