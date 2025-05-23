const { db } = require("../firebase");
const { Timestamp } = require("firebase-admin/firestore");
const { getDateRange } = require("../utils/dateFilters"); // OK

exports.createTask = async (req, res) => { // OK
  try {
    const {
      assignedTo,
      createdBy,
      description,
      startTime,
      endTime,
      priority,
      status,
      title,
    } = req.body;

    // Validate required fields
    if (
      !description ||
      !title ||
      !createdBy ||
      !assignedTo ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newTask = {
      assignedTo,
      createdAt: Timestamp.now(),
      createdBy,
      description,
      endTime: Timestamp.fromDate(new Date(endTime)),
      priority: priority || "normal",
      startTime: Timestamp.fromDate(new Date(startTime)),
      status: status || "pending",
      title,
    };

    const docRef = await db.collection("tasks").add(newTask);

    return res.status(201).json({ id: docRef.id, ...newTask });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.taskStatus = async (req, res) => {
  try {
    //console.log("ola")// ELIMINAR LOGS
    
    const { uid } = req.params; // OK
    const requestingUserId = req.user.uid; // OK, usando el nombre de variable que ya tenías

    // 1. Verificar permisos (solo el propio usuario o admin puede ver sus tareas)
    const userDoc = await db.collection("users").doc(requestingUserId).get();
    const userData = userDoc.data();

    if (uid !== requestingUserId && !userData.isAdmin) { // CORREGIDO: 'requestingUserUid' a 'requestingUserId'
      return res
        .status(403)
        .json({ error: "No autorizado para ver estas tareas" });
    }

    // 2. Verificar que el usuario solicitado existe
    //console.log("ola2")// ELIMINAR LOGS
    const requestedUserDoc = await db.collection("users").doc(uid).get(); // OK
    if (!requestedUserDoc.exists) {
      return res
        .status(404)
        .json({ error: "Usuario solicitado no encontrado" });
    }
    // console.log("ola3") // ELIMINAR LOGS

    // 3. Construir consulta base
    let tasksQuery = db.collection("tasks").where("assignedTo", "==", uid); // OK

    // 4. Aplicar filtros opcionales
    const { status, priority } = req.query;

    if (status) {
      tasksQuery = tasksQuery.where("status", "==", status);
    }

    if (priority) {
      tasksQuery = tasksQuery.where("priority", "==", priority);
    }

    const { today, week } = req.query;
    if (today === "true") {
      const { startDate, endDate } = getDateRange("today");
      tasksQuery = tasksQuery
        .where("startTime", ">=", startDate)
        .where("startTime", "<=", endDate);
    }
    
    if (week === "true") {
      const { startDate, endDate } = getDateRange("week");
      tasksQuery = tasksQuery
        .where("startTime", ">=", startDate)
        .where("startTime", "<", endDate);
    }
    //console.log("ola4")// ELIMINAR LOGS

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
        id: uid, // OK
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