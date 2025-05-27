const { Router } = require("express");
const { db } = require("../firebase");
const { createTask } = require("../controllers/taskController");
const { checkAdminPrivileges } = require("../middlewares/authorization");
const { verifyAndDecodeToken } = require("../middlewares/authentication");
const { getDateRange } = require("../utils/dateFilters");
const { getAllTasks } = require("../middlewares/retrieve_tasks");
const { getUserTasks } = require("../middlewares/retrieve_tasks");
const { getUserTaskStatus } = require("../middlewares/retrieve_tasks");

const router = Router();

// Crear tarea usando el controlador en controllers/taskController.js
router.post("/createTask", verifyAndDecodeToken, checkAdminPrivileges, createTask); 

//ruta para ver las tareas
router.get("/tasks", getAllTasks);

// Obtener todas las tareas de un usuario específico
router.get("/tasks/:userId", getUserTasks);

// Obtener estado de las tareas del usuario donde tanto como el admin y el usuario puede ver tareas asignadas a alguien
router.get("/statustasks/:userId", verifyAndDecodeToken, getUserTaskStatus);

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
      return res
        .status(403)
        .json({ error: "Solo administradores pueden reasignar tareas" });
    }

    // Verifica que el nuevo usuario existe
    const userDoc = await db.collection("users").doc(newAssignedToUid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "Nuevo usuario no encontrado" });
    }

    // Actualiza la tarea con el nuevo assignedTo (usando uid)
    await db.collection("tasks").doc(taskId).update({
      assignedTo: newAssignedToUid,
    });

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

// Actualizar el estado de una tarea
router.patch("/tasks/:taskId/status", verifyAndDecodeToken, async (req, res) => {
    try {
      const { taskId } = req.params;
      const { status } = req.body;
      const userId = req.user.uid;

      const validStatuses = ["pendiente", "en progreso", "completada"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Estado inválido." });
      }

      const taskRef = db.collection("tasks").doc(taskId);
      const taskDoc = await taskRef.get();

      if (!taskDoc.exists) {
        return res.status(404).json({ error: "Tarea no encontrada." });
      }

      const taskData = taskDoc.data();

      // Ensure the task belongs to the user
      if (taskData.assignedTo !== userId) {
        return res
          .status(403)
          .json({ error: "No tienes permiso para modificar esta tarea." });
      }


      const updateData = { status };
      // Registrar hora real de inicio
      if (status === "en progreso" && !taskData.realStartTime) {
        updateData.realStartTime = Timestamp.now();
      }


      // Registrar hora real de finalización
      if (status === "completada" && !taskData.realEndTime) {
        updateData.realEndTime = Timestamp.now();
      }
      // Update the status
      await taskRef.update(updateData);

      res.json({ message: "Estado de la tarea actualizado exitosamente." });
    } catch (error) {
      console.error("Error al actualizar el estado de la tarea:", error);
      res.status(500).json({ error: "Error al actualizar el estado." });
    }
  }
);

router.get("/tasks/done/today", verifyAndDecodeToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { startDate, endDate } = getDateRange("today");

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const snapshot = await db
      .collection("tasks")
      .where("assignedTo", "==", userId)
      .where("status", "==", "completada") // o "done", depende cómo esté en tu BD
      .where("realStartTime", ">=", startTimestamp)
      .where("realStartTime", "<=", endTimestamp)
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

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Error al obtener tareas completadas del día:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
});

module.exports = router;
