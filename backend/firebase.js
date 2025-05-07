//Aquí está la lógica para conectarnos a Firebase
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config(); //solo para usar los .env
const{initializeApp, applicationDefault}=require('firebase-admin/app') ;//para inicializar firebase en el proyecto 
const{getFirestore}=require('firebase-admin/firestore'); //para acceder al servicio firestore (a la bbdd en si)

initializeApp({
    credential: applicationDefault(), //busca automaticamente las credenciales, para esto deben 
                                     //dentro del archivo .env dentro de la carpeta backend
});

const db = getFirestore();  //obtiene la db
const auth = getAuth();

module.exports = {
    db, auth    //la exportamos para usarla en app.js
};