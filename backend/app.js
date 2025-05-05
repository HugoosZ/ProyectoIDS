const express = require('express'); //importamos express

const app = express();
const morgan = require('morgan');   //esto es solo para ver las consultas en la consola

app.use(morgan('dev')); 

const {db} = require('./firebase'); // para traer el objeto db que se exporta de firebase.js

app.get('/', async (req, res) => {
    const querySnapshot = await db.collection('users').get()    //consulta de prueba a db

    console.log(querySnapshot.docs[0].data()); //para ver los datos que se recuperan
})
module.exports = app;  //esporta app para usarlo en index.js