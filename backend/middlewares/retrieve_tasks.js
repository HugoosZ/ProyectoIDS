// backend/middlewares/retrieve_tasks.js
const { db } = require("../firebase"); // Asegúrate de que importas 'db' de firebase.js
const { Timestamp } = require("firebase-admin/firestore"); // Para manejar fechas de Firestore
const { getDateRange } = require("../utils/dateFilters"); // Asegúrate de que esta utilidad exista y funcione.

exports.getUserTaskStatus = async (req, res) => {
  try {
    
    const { userId } = req.params;
    const requestingUserId = req.userId; // ID del usuario que hace la petición (del token)

    // 1. Verificar permisos (solo el propio usuario o admin puede ver sus tareas)
    const userDoc = await db.collection("users").doc(requestingUserId).get();
    const userData = userDoc.data();

    if (userId !== requestingUserId && !userData.isAdmin) {
      return res
        .status(403)
        .json({ error: "No autorizado para ver estas tareas" });
    }

    // 2. Verificar que el usuario solicitado existe
    const requestedUserDoc = await db.collection("users").doc(userId).get();
    if (!requestedUserDoc.exists) {
      return res
        .status(404)
        .json({ error: "Usuario solicitado no encontrado" });
    }

    // 3. Construir consulta base
    let tasksQuery = db.collection("tasks").where("assignedTo", "==", userId);

    // 4. Aplicar filtros opcionales
    const { status, priority } = req.query;

    if (status) {
      tasksQuery = tasksQuery.where("status", "==", status); // filtro de estado
    }

    if (priority) {
      tasksQuery = tasksQuery.where("priority", "==", priority); // filtro de prioridad
    }

    const { today, week } = req.query;
    if (today === "true") {
      // filtro por dia
      const { startDate, endDate } = getDateRange("today");
      tasksQuery = tasksQuery
        .where("startTime", ">=", startDate)
        .where("startTime", "<=", endDate);
    }
    
    if (week === "true") {
      // filtro por semana
      const { startDate, endDate } = getDateRange("week");
      tasksQuery = tasksQuery
        .where("startTime", ">=", startDate)
        .where("startTime", "<", endDate);
    }

    // 5. Ordenar por fecha de creación (nuevas primero)
    tasksQuery = tasksQuery.orderBy("createdAt", "desc");

    // 6. Ejecutar consulta
    const snapshot = await tasksQuery.get();

    // 7. Formatear respuesta
    const tasks = snapshot.docs.map((doc) => {
      const taskData = doc.data();
      return {
        id: doc.id,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        startTime: taskData.startTime?.toDate() || null,
        endTime: taskData.endTime?.toDate() || null,
        createdAt: taskData.createdAt.toDate(),
      };
    });

    res.status(200).json({
      user: {
        id: userId,
        name: requestedUserDoc.data().name,
        lastName: requestedUserDoc.data().lastName,
      },
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Error al obtener tareas:", error);

    if (error.code === 3) {
      return res
        .status(400)
        .json({ error: "Parámetros de consulta inválidos" });
    }

    res.status(500).json({
      error: "Error al obtener tareas",
      details: error.message,
    });
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
      .where("assignedTo", "==", userId)
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