//archivos donde se deben crear todas las rutas de acceso a la db
const express = require('express');
const router = express.Router();

const taskRoutes = require('./tasks');
const usersRoutes = require('./users');
const loginRoute = require('./login');

router.use('/tasks', taskRoutes);
router.use('/login', loginRoute);
router.use('/users', usersRoutes);

module.exports = router;