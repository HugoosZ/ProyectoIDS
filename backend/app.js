const express = require('express'); //importamos express


const app = express();
const morgan = require('morgan');   //esto es solo para ver las consultas en la consola

app.use(morgan('dev')); 

app.use(express.json()); // permite entender formularios que recibe por ejemplo en un post
app.use(express.urlencoded({extended: false}));

const cors = require('cors');
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

// Importa y usa los routers con prefijos claros
const mainRouter = require('./routes/index');
const adminRouter = require('./routes/adminRoutes');
const taskRoutes = require('./routes/tasks');
const usersRoutes = require('./routes/users');
//const aux = require('./routes/test.js')
const authRoutes = require('./routes/authRoutes');

//Rutas publicas
app.use('/api', taskRoutes);
app.use('/api', usersRoutes);
//app.use('/api', aux);
app.use('/api', mainRouter);       


 // Rutas admin!!!
app.use('/api/', adminRouter); // Rutas admin empezarán con /api/admin
app.use('/api/auth', authRoutes); //De prueba!! Se puede borrar


module.exports = app;  //esporta app para usarlo en index.js