const express = require('express');
const router = express.Router();
const { auth } = require('../firebase'); // Importa auth de Firebase

// Ruta para validar el JWT
router.get('/validate-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verifica el token con Firebase
    const decodedToken = await auth.verifyIdToken(token);
    
    res.json({ 
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email
    });
    
  } catch (error) {
    console.error('Error al validar token:', error);
    res.status(401).json({ valid: false, error: 'Token inválido' });
  }
});

module.exports = router;