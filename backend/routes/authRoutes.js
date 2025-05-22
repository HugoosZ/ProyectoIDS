const express = require('express');
const router = express.Router();
const { auth } = require('../firebase'); // Importa auth de Firebase
const { login, cambiarPassword } = require('../controllers/authController');

// Ruta de login (Por ahora no se usará)
router.post('/login', login);

// Ruta para cambiar contraseña (Por ahora no se usará)
router.post('/cambiar-password', cambiarPassword);

module.exports = router;