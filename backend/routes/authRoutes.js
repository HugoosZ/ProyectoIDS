const express = require('express');
const router = express.Router();
const { auth } = require('../firebase'); // Importa auth de Firebase
const { login, cambiarPassword } = require('../controllers/authController');

// Ruta para validar el JWT
router.post('/validate-token', async (req, res) => {
    try {
      console.log("Headers recibidos:", req.headers); // Log para ver headers
  
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        console.log("⚠️ No se recibió header 'Authorization'");
        return res.status(401).json({ valid: false, error: 'Token no proporcionado' });
      }
  
      if (!authHeader.startsWith('Bearer ')) {
        console.log("⚠️ Formato incorrecto (debe ser 'Bearer <token>')");
        return res.status(401).json({ valid: false, error: 'Formato de token inválido' });
      }
  
      const token = authHeader.split(' ')[1];
      console.log("✅ Token recibido:", token); //  Log del token recibido
  
      // Verifica el token con Firebase
      const decodedToken = await auth.verifyIdToken(token);
      console.log("🔑 Token decodificado:", decodedToken); //  Datos del usuario
  
      res.json({ 
        valid: true,
        uid: decodedToken.uid,
        email: decodedToken.email,
        message: "Token válido ✅" // 👈 Mensaje de éxito
      });
  
    } catch (error) {
      console.error('❌ Error al validar token:', error.message);
      res.status(401).json({ 
        valid: false, 
        error: 'Token inválido',
        details: error.message // 👈 Mensaje de error detallado
      });
    }
  });

// Ruta de login
router.post('/login', login, async (req, res) => {
  // Como ya se pasaron las auntenticaciones se puede postear el json
   console.log("Login exitoso");
});

// Ruta para cambiar contraseña
router.post('/cambiar-password', cambiarPassword);

module.exports = router;