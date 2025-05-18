// en common js
const admin = require('firebase-admin');

// Inicializar solo si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // o usa admin.credential.cert() con tu key
    databaseURL: "https://<your-project-id>.firebaseio.com"
  });
}

// Exportar auth y db
const auth = admin.auth();
const db = admin.firestore();

module.exports = { auth, db };



/*// Importar el SDK de Firebase Admin
import admin from 'firebase-admin';

// Inicializar solo si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // o admin.credential.cert() si usas una key JSON
    databaseURL: "https://<your-project-id>.firebaseio.com"
  });
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };
*/


