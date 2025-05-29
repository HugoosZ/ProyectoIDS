const { Router } = require('express');
const { db } = require('../firebase');
const { verifyAndDecodeToken } = require('../middlewares/authentication');
const { checkAdminPrivileges } = require('../middlewares/authorization');

const router = Router();

router.get('/users', verifyAndDecodeToken, checkAdminPrivileges, async (req, res) => {
    try {
        // Obtenemos el empresaId del administrador logueado (inyectado por verifyAndDecodeToken)
        const adminEmpresaId = req.user.empresaId;

        if (!adminEmpresaId) {
            // Si el admin no tiene un empresaId, no puede acceder a los usuarios
            return res.status(403).json({ message: "Forbidden: Admin user is not associated with an enterprise." });
        }

        // Consulta a Firestore para obtener solo los usuarios de la misma empresa
        const snapshot = await db.collection('users')
                                .where('empresaId', '==', adminEmpresaId)
                                .get();

        if (snapshot.empty) {
            return res.status(200).json([]); // Devuelve un array vacío si no hay usuarios en esa empresa
        }

        const users = snapshot.docs.map(doc => {
            const userData = doc.data();
            // Opcional: Eliminar campos sensibles antes de enviar la respuesta
            delete userData.password; // Si almacenas contraseñas, elimínala
            // delete userData.someOtherSensitiveField;
            return {
                id: doc.id,
                ...userData
            };
        });

        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener usuarios', details: error.message });
    }
});
router.get('/UserInfo', verifyAndDecodeToken, async (req, res) => {
  try {
      res.status(200).json({
        uid: req.user.uid,
        email: req.user.email,
      });
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    res.status(500).json({ error: 'Error al obtener información del usuario' });
  }
});


module.exports = router; 
