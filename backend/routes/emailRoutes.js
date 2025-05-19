const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Ruta para recuperación de contraseña
router.post('/password-recovery', emailController.handlePasswordRecovery);

// Ruta para enviar correo de prueba
router.get('/test-email', emailController.sendTestEmail);

module.exports = router; 