const { db } = require('../firebase');

exports.checkAdminPrivileges = async (req, res, next) => {
    try {
        const rut = req.user.uid; // RUT

        const userDoc = await db.collection('users').doc(rut).get();  // Paso 2: Consulta SOLO el documento de ese RUT
        if (!userDoc.exists || !userDoc.data().isAdmin) {
            return res.status(403).json({ error: 'Se requiere rol admin' });
        }
        next();
    } catch (error) {
      res.status(500).json({ error: 'Error al validar permisos' });
    }
};