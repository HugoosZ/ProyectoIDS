require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const firebaseCredentials = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

const firebaseApp = initializeApp({
    credential: cert(firebaseCredentials)
});

const db = getFirestore();

module.exports = { db };
