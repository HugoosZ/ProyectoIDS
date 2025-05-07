//archivos donde se deben crear todas las rutas de acceso a la db
const express = require('express');
const router = express.Router();

const taskRoutes = require('./tasks');
const usersRoutes = require('./users');

router.use('/api', taskRoutes);
router.use('/api', usersRoutes);

module.exports = router;