// backend/middlewares/retrieve_tasks.js
const { db } = require("../firebase"); // Asegúrate de que importas 'db' de firebase.js
const { Timestamp } = require("firebase-admin/firestore"); // Para manejar fechas de Firestore
const { getDateRange } = require("../utils/dateFilters"); // Asegúrate de que esta utilidad exista y funcione.

exports.getUserTaskStatus = async (req, res) => {
  try {

    const { userId: userId } = req.params; //ID del usuario desde los parámetros de la ruta
    const tokenUserId = req.user.uid; //ID del usuario desde el jwt

    if (userId !== tokenUserId) {
      return res.status(403).json({ error: "No tienes permiso para acceder a estas tareas." });
    }

/* 
    // 1. Obtener los datos del usuario solicitado (el del `:userId` en la URL)
    const requestedUserDoc = await db.collection("users").doc(userId).get();

    const requestedUserData = requestedUserDoc.data();
    const { empresaId, isAdmin } = requestedUserDoc.data();
    
    const requestedUserEmpresaId = requestedUserDoc.data().empresaId; // EmpresaId del usuario solicitado

    let tasksQuery = db
      .collection("tasks")
      .where("assignedTo", "==", userId)
      .where("empresaId", "==", requestedUserEmpresaId); // Filtro crucial por empresaId

 */    // 4. Aplicar filtros opcionales (status, priority, today, week)
    const { status, priority, today, week } = req.query;
    
    if (typeof status !== "undefined" && status !== null && status !== "") {
      tasksQuery = tasksQuery.where("status", "==", status);
    }

    if (typeof priority !== "undefined" && priority !== null && priority !== "") {
      tasksQuery = tasksQuery.where("priority", "==", priority);
    }

    // Considerar "today" y "week" mutuamente excluyentes (se usa else if)
    if (today === "true") {
      const { startDate, endDate } = getDateRange("today");
      tasksQuery = tasksQuery
        .where("startTime", ">=", startDate)
        .where("startTime", "<=", endDate);
    } else if (week === "true") {
      const { startDate, endDate } = getDateRange("week");
      tasksQuery = tasksQuery
        .where("startTime", ">=", startDate)
        .where("startTime", "<", endDate); // Usar < para semana completa
    }

    // 5. Ordenar los resultados
    tasksQuery = tasksQuery.orderBy("createdAt", "desc");

    // 6. Ejecutar la consulta
    const snapshot = await tasksQuery.get();

    // 7. Formatear la respuesta
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
        createdAt: taskData.createdAt.toDate()
        //empresaId: taskData.empresaId, 
      };
    });


    res.status(200).json({
      user: {
        id: userId,
        name: requestedUserDoc.data().name,
        lastName: requestedUserDoc.data().lastName,
        //empresaId: requestedUserDoc.data().empresaId, // Incluir el empresaId del usuario solicitado
      },
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Error al obtener tareas (getUserTaskStatus):", error);
    res.status(500).json({
      error: "Error interno del servidor al obtener tareas.",
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