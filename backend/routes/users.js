const { Router } = require('express');
const { db } = require('../firebase');
const { verifyAndDecodeToken } = require('../middlewares/authentication');
const { checkIn, checkOut } = require('../controllers/attendanceController');
const { checkAdminPrivileges } = require('../middlewares/authorization');
const { getDateRange } = require("../utils/dateFilters");
const { decrypt, hashRut } = require('../utils/crypto'); 

const router = Router();


// Ruta para buscar usuario por RUT (usando hash) y retorna el RUT decodificado
router.post('/findByRut', async (req, res) => {
  try {
    const { rut } = req.body;
    if (!rut) {
      return res.status(400).json({ error: 'El RUT es necesario.' });
    }
    
    const rutHash = hashRut(rut);
    const snapshot = await db.collection('users').where('rutHash', '==', rutHash).limit(1).get();
    if (snapshot.empty) {
      return res.status(404).json({ error: 'Usuario no encontrado con ese RUT.' });
    }
    const doc = snapshot.docs[0];
    const userData = doc.data();
    res.status(200).json({ uid: userData.rut });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al buscar usuario por RUT.' });
  }
});

// Ruta para CheckIn de asistencia del usuario
router.post('/checkIn/:userId', verifyAndDecodeToken, checkIn);

// Ruta para CheckOut de asistencia del usuario
router.patch('/checkOut/:userId', verifyAndDecodeToken, checkOut);

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
      let name = userData?.name || null;
      let lastName = userData?.lastName || null;
      let rut = userData?.rut || null;
      try { name = decrypt(name); } catch (e) {}
      try { lastName = decrypt(lastName); } catch (e) {}
      try { rut = decrypt(rut); } catch (e) {}
      return {
        asistenciaId: doc.id,
        ...asistenciaData,
        user: userData ? {
          name,
          lastName,
          rut,
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
