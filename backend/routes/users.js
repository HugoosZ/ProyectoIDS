const { Router } = require('express');
const { db } = require('../firebase');
const { verifyAndDecodeToken } = require('../middlewares/authentication');
const { checkIn, checkOut } = require('../controllers/attendanceController');
const { checkAdminPrivileges } = require('../middlewares/authorization');
const { getDateRange } = require("../utils/dateFilters");
const { decrypt } = require('../utils/crypto'); // <-- Importa decrypt

const router = Router();

// Ruta para CheckIn de asistencia del usuario
router.post('/checkIn/:userId', verifyAndDecodeToken, checkIn);

// Ruta para CheckOut de asistencia del usuario
router.patch('/checkOut/:userId', verifyAndDecodeToken, checkOut);

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
            let name = userData.name;
            let lastName = userData.lastName;
            let rut = userData.rut;
            try { name = decrypt(name); } catch (e) {}
            try { lastName = decrypt(lastName); } catch (e) {}
            try { rut = decrypt(rut); } catch (e) {}
            // Opcional: Eliminar campos sensibles antes de enviar la respuesta
            delete userData.password; // Si almacenas contraseñas, elimínala
            // delete userData.someOtherSensitiveField;
            return {
                id: doc.id,
                ...userData,
                name,
                lastName,
                rut
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

// Ruta para obtener la asistencia de todos los usuarios, de uno específico, presentes o ausentes
router.get("/User/attendance/:userId", verifyAndDecodeToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isPresent, time } = req.query;

    if (userId !== req.user.uid) {
      return res.status(403).json({ error: "No tienes permiso para acceder a la asistencia de este usuario." });
    }
    let query = db.collection("asistencias").where("userId", "==", userId);

    if (isPresent === "true") {
      query = query.where("isPresent", "==", true);
    } else if (isPresent === "false") {
      query = query.where("isPresent", "==", false);
    }

    if (time === "today" || time === "week") {
      const dateFilter = getDateRange(time);
      query = query
        .where("date", ">=", dateFilter.startDate)
        .where("date", "<=", dateFilter.endDate);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      return res.status(404).json({ message: "No se encontró asistencia para el/los usuario(s) con los filtros dados" });
    }
    const attendance = await Promise.all(snapshot.docs.map(async (doc) => {
      const asistenciaData = doc.data();
      const userDoc = await db.collection("users").doc(asistenciaData.userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      return {
        asistenciaId: doc.id,
        ...asistenciaData,
        user: userData ? {
          name: userData.name || null,
          email: userData.email || null
        } : null
      };
    }));
    res.status(200).json(attendance);
  } catch (error) {
    console.error("Error al obtener asistencia:", error);
    res.status(500).json({ error: "Error al obtener asistencia" });
  }
});



module.exports = router;
