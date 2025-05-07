const { Router } = require('express');
const { db } = require('../firebase');

const router = Router();

//ruta login
router.post('/login', async (req, res) => {
    const { rut, idToken } = req.body;
  
    if (!rut || !idToken) {
      return res.status(400).json({ error: 'Faltan campos' });
    }
  
    try {
      // Buscar usuario por rut
      const snapshot = await db.collection('users').where('rut', '==', rut).get();
  
      if (snapshot.empty) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
  
      const userData = snapshot.docs[0].data();
      const email = userData.email;
  
      // Verificar token
      const decodedToken = await auth.verifyIdToken(idToken);
  
      if (decodedToken.email !== email) {
        return res.status(401).json({ error: 'Token inválido para este RUT' });
      }
  
      res.status(200).json({ message: 'Login exitoso', user: userData });
  
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

module.exports = router;