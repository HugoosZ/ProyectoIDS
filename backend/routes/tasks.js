const { Router } = require("express");
const { db } = require("../firebase");
const { createTask, getAllCompanyTasks, getTasksByUserId, updateTaskStatus } = require("../controllers/taskController");
const { checkAdminPrivileges, checkEmpresaId } = require("../middlewares/authorization");
const { verifyAndDecodeToken } = require("../middlewares/authentication");
const { getDateRange, getDateRangeWithTimezone } = require("../utils/dateFilters");
const { getAllTasks, getUserTasks, getUserTaskStatus } = require("../middlewares/retrieve_tasks");
const { Timestamp } = require("firebase-admin/firestore");
const taskController = require("../controllers/taskController");
const { decrypt } = require("../utils/crypto"); // Importa decrypt

const router = Router();

// Crear tarea usando el controlador en controllers/taskController.js
router.post("/createTask", verifyAndDecodeToken, checkAdminPrivileges, createTask); 

//ruta para ver las tareas
router.get("/tasks", verifyAndDecodeToken, taskController.getAllCompanyTasks);

// Obtener todas las tareas de un usuario específico
router.get("/tasks/:userId", verifyAndDecodeToken, checkEmpresaId, taskController.getTasksByUserId);

// Actualizar el estado de una tarea
router.patch("/tasks/:taskId/status", verifyAndDecodeToken, updateTaskStatus);

// Obtener estado de las tareas del usuario donde tanto como el admin y el usuario puede ver tareas asignadas a alguien
router.get("/statustasks/:userId", verifyAndDecodeToken, getUserTaskStatus);

// Codigo para relevo y verificacion de codigo
router.post('/tasks/:taskId/relief', verifyAndDecodeToken, taskController.realizarRelevo);

// Ruta para generar código de 6 digitos para relevo
router.post('/tasks/:taskId/generarCodigoRelevo', verifyAndDecodeToken, taskController.generarCodigoRelevo);

router.get('/getDailyTasks/', verifyAndDecodeToken, taskController.getDailyTaskStatus);

// Reasignar tarea a usuario usando uid en lugar de rut
router.put("/reassign-task/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const { newAssignedToUid, adminUid } = req.body;

  if (!newAssignedToUid || !adminUid) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    // Verifica que el admin existe y tiene permisos
    const adminDoc = await db.collection("users").doc(adminUid).get();
    if (!adminDoc.exists || !adminDoc.data().isAdmin) {
      return res.status(403).json({ error: "Solo administradores pueden reasignar tareas" });
    }

    const taskRef = db.collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    const taskData = taskDoc.data();
    const previousAssignedToUid = taskData.assignedTo;

    // Verifica que el nuevo usuario existe
    const userDoc = await db.collection("users").doc(newAssignedToUid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "Nuevo usuario no encontrado" });
    }

    // Actualiza la tarea con el nuevo assignedTo
    await taskRef.update({
      assignedTo: newAssignedToUid,
    });

    const today = new Date().toISOString().split('T')[0];

    // Restar 1 al currentTasks del usuario anterior
    const previousAsistenciaQuery = await db.collection('asistencias')
      .where('userId', '==', previousAssignedToUid)
      .where('date', '==', today)
      .limit(1)
      .get();

    if (!previousAsistenciaQuery.empty) {
      const asistenciaDoc = previousAsistenciaQuery.docs[0];
      const current = asistenciaDoc.data().currentTasks || 0;

      await asistenciaDoc.ref.update({
        currentTasks: Math.max(0, current - 1),
      });
    }

    // Sumar 1 al currentTasks del nuevo usuario
    const newAsistenciaQuery = await db.collection('asistencias')
      .where('userId', '==', newAssignedToUid)
      .where('date', '==', today)
      .limit(1)
      .get();

    if (!newAsistenciaQuery.empty) {
      const asistenciaDoc = newAsistenciaQuery.docs[0];
      const current = asistenciaDoc.data().currentTasks || 0;

      await asistenciaDoc.ref.update({
        currentTasks: current + 1,
      });
    }

    res.status(200).json({ message: "Tarea reasignada con éxito" });
  } catch (error) {
    console.error("Error al reasignar tarea:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/pendingTasks/:userId", async (req, res) => {
  // Visualizar tareas pendientes de forma general
  const { userId } = req.params;
  try {
    const snapshot = await db
      .collection("tasks")
      .where("status", "==", "pendiente" && "assignedTo", "==", userId)
      .get();
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ tasks });
  } catch (error) {
    console.error("Error fetching pending tasks:", error);
    res.status(500).json({ error: "Failed to fetch pending tasks" });
  }
});




router.get("/tasks/done/:userId/today/", verifyAndDecodeToken, async (req, res) => {
  try {
    const { userId: paramUserId } = req.params;
    const tokenUserId = req.user.uid;

    if (paramUserId !== tokenUserId) {
      return res.status(403).json({ error: "No tienes permiso para acceder a estas tareas." });
    }

    // Usa la función con zona horaria para obtener el rango correcto
    const { Timestamp } = require("firebase-admin/firestore");
    const { startDate, endDate } = getDateRangeWithTimezone("today");
    const startTimestamp = Timestamp.fromDate(startDate);
    // endDate es fin de día, así que debe incluir todo el día
    const endTimestamp = Timestamp.fromDate(endDate);

    const snapshot = await db
      .collection("tasks")
      .where("assignedTo", "==", tokenUserId)
      .where("status", "==", "completada")
      .where("realStartTime", ">=", startTimestamp)
      .where("realEndTime", "<=", endTimestamp)
      .where("realStartTime", "<=", endTimestamp)
      .where("realEndTime", ">=", startTimestamp)

      .get();

    const tasks = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.realEndTime) {
        tasks.push({
          id: doc.id,
          description: data.description,
          status: data.status,
          realStartTime: data.realStartTime.toDate(),
          realEndTime: data.realEndTime.toDate(),
        });
      }
    });

    console.log("[tasks/done/:userId/today] tasks result:", tasks);
    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Error al obtener tareas completadas del día:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

router.get("/my-tasks", verifyAndDecodeToken, async (req, res) => {
  const userId = req.user.uid; // Obtenemos el UID del token

  try {
    const snapshot = await db
      .collection("tasks")
      .where("assignedTo", "==", userId)
      .get();
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error al obtener tareas del usuario autenticado:", error);
    res.status(500).json({ error: "Error al obtener tareas" });
  }
});

router.post("/assignTask", verifyAndDecodeToken, checkAdminPrivileges, taskController.AssignTask);


module.exports = router;
