const express = require('express'); //importamos express

const app = express();
const morgan = require('morgan');   //esto es solo para ver las consultas en la consola

app.use(morgan('dev')); 

app.use(require('./routes/index'));

module.exports = app;  //esporta app para usarlo en index.js