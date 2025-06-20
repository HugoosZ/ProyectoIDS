// backend/middlewares/retrieve_tasks.js
const { db } = require("../firebase"); // Asegúrate de que importas 'db' de firebase.js
const { Timestamp } = require("firebase-admin/firestore"); // Para manejar fechas de Firestore
const { getDateRange } = require("../utils/dateFilters"); // Asegúrate de que esta utilidad exista y funcione.
const { decrypt } = require('../utils/crypto'); // <-- Importa decrypt
const admin = require('firebase-admin');

exports.getUserTaskStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { uid: requesterId, empresaId: requesterEmpresa, isAdmin } = req.user;

    // Permisos
    if (!isAdmin && requesterId !== userId) {
      return res.status(403).json({ error: 'No autorizado.' });
    }

    // Buscar asignaciones
    const assignmentsSnap = await db
      .collection('taskAssignments')
      .where('assignedTo', '==', userId)
      .get();

    if (assignmentsSnap.empty) return res.json([]);

    const assignments = assignmentsSnap.docs.map(doc => ({
      assignmentId: doc.id,
      ...doc.data(),
    }));
    const taskInfoIds = [...new Set(assignments.map(a => a.taskInfoId))];

    // Obtener taskInfo
    const taskInfoSnap = await db
      .collection('taskInfo')
      .where(admin.firestore.FieldPath.documentId(), 'in', taskInfoIds)
      .get();

    const taskInfos = {};
    taskInfoSnap.docs.forEach(doc => taskInfos[doc.id] = doc.data());

    // (Opcional) Obtener datos de plantilla en 'tasks' si lo necesitas
    const taskIds = [...new Set(taskInfoSnap.docs.map(d => d.data().taskId))];
    const tasksSnap = await db
      .collection('tasks')
      .where(admin.firestore.FieldPath.documentId(), 'in', taskIds)
      .get();
    const tasks = {};
    tasksSnap.docs.forEach(doc => tasks[doc.id] = doc.data());

    // Combinar todo
    const result = assignments.map(a => {
      const info = taskInfos[a.taskInfoId] || {};
      const plantilla = tasks[info.taskId] || {};
      return {
        assignmentId: a.assignmentId,
        taskInfoId: a.taskInfoId,
        assignedTo: a.assignedTo,
        individualTask: a.individualTask,
        status: a.status,
        startTimeIndividualTask: a.startTimeIndividualTask,
        endTimeIndividualTask: a.endTimeIndividualTask,
        requiereRelevo: a.requiereRelevo,
        isGroupTask: a.isGroupTask,
        priority: a.priority,
        createdAt: info.createdAt,
        startTime: info.startTime,
        endTime: info.endTime,
        taskName: plantilla.title || null,
        taskDescription: plantilla.description || null,
        empresaId: info.empresaId,
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno al cargar tareas.' });
  }
};



exports.getAllTasks = async (req, res) => {
  try {
    const snapshot = await db.collection("tasks").get();
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ error: "Error al obtener tareas" });
  }
};

exports.getUserTasks = async (req, res) => {
  const { userId } = req.params;
  try {
    const snapshot = await db
      .collection("tasks")
      .where("assignedTo", "array-contains", userId)
      .get();
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ error: "Error al obtener tareas" });
  }
};
