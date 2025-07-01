const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

const { verifyAndDecodeToken } = require("../middlewares/authentication"); //  Middleware de autenticación
const { decrypt } = require('../utils/crypto');
const userController = require('../controllers/userController');
const { checkAdminPrivileges } = require("../middlewares/authorization"); // Middleware de autorización
// Se usa llaves en la asignacion de nombres para poder renombrarlos, si no, hay que ponerle el nombre del codigo y como son parecidos es mejor renombrar
const { getDateRange } = require("../utils/dateFilters");
const taskController = require('../controllers/taskController');


// Nueva Ruta para obtener todas las tareas de la empresa con detalles de participantes para el Admin
router.get("/admin/tasks/detailed", verifyAndDecodeToken, checkAdminPrivileges, taskController.getAdminDetailedTasks);

router.get("/checkAdmin", verifyAndDecodeToken, checkAdminPrivileges, async (req, res) => {
    // Como ya se pasaron las auntenticaciones se puede postear el json
    res.json({ isAdmin: true });
  }
);


// Ruta para obtener todos los usuarios de la empresa (Agregar auntenticacion)
router.get('/admin/users', verifyAndDecodeToken, checkAdminPrivileges, userController.getUsersByEmpresa);



router.post("/createUser", verifyAndDecodeToken, checkAdminPrivileges, userController.createUser);

router.post("/createUserAUX", userController.createUser); //Ruta sin autenticacion de prueba

router.get("/", async (req, res) => {
  res.send("¡Ruta /api/admin funciona correctamente!");
});

// Ruta para obtener todas las tareas pendientes, en progreso o no asignadas de un usuario específico
router.get("/admin/tasks", verifyAndDecodeToken, checkAdminPrivileges, async (req, res) => {
  try {
    const { status, userId, time } = req.query;
    let query = db.collection("tasks");
    const validStatuses = ["en progreso", "pendiente", "completada", "cancelada"];
    

    console.log("Query parameters:", { status, userId, time });
    let dateFilter = null;
    if (time === "today" || time === "week") {
      dateFilter = getDateRange(time);
    }

    if (status === "sin asignar") {
      // Tareas no asignadas: status = sin asignar y assignedTo = null
      query = query
        .where("status", "==", "sin asignar")
        .where("assignedTo", "==", null);
    } else if (validStatuses.includes(status)) {
      // Tareas con cualquier otro estado
      query = query.where("status", "==", status);
      if (userId) {
        query = query.where("assignedTo", "==", userId); // Si se especifica un usuario, filtrar por él
      }
    } else {
      return res.status(400).json({
        error:
          "Estado no válido. Los estados permitidos son: sin asignar, " +
          validStatuses.join(", "),
      });
    }

    if (dateFilter) {
      query = query
        .where("startTime", ">=", dateFilter.startDate)
        .where("startTime", "<=", dateFilter.endDate);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      return res
        .status(404)
        .json({ message: "No se encontraron tareas con ese estado" });
    }
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ error: "Error al obtener tareas" });
  }
}
);


// Ruta para obtener informacion de trabajadores que esten presentes y que no tengan tareas asignadas en el bloque de tiempo en el que se tienen asignadas las tareas

router.get("/admin/workers/isPresent/NoTasks", verifyAndDecodeToken, checkAdminPrivileges, async (req, res) => {
  try {
    // Filtra asistencias por trabajadores presentes y sin tareas
    const query = db.collection("asistencias")
     //.where("isPresent", "==", true)
      .where("currentTasks", "==", 0);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No se encontraron trabajadores presentes sin tareas asignadas" });
    }

    // Para cada asistencia encontrada, buscar los datos del usuario correspondiente
    const workers = await Promise.all(snapshot.docs.map(async (doc) => {
      const asistenciaData = doc.data();
      const userId = asistenciaData.userId;

      const userDoc = await db.collection("users").doc(userId).get();
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

    res.status(200).json(workers);
  } catch (error) {
    console.error("Error al obtener trabajadores y sus tareas:", error);
    res.status(500).json({ error: "Error al obtener trabajadores y sus tareas" });
  }
});

// Ruta para obtener la asistencia de todos los usuarios, de uno específico, presentes o ausentes
router.get("/admin/attendance", verifyAndDecodeToken, checkAdminPrivileges, async (req, res) => {
  try {
    const { userId, isPresent, time } = req.query;
    let query = db.collection("asistencias");
    if (userId) {
      query = query.where("userId", "==", userId);
    }
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
