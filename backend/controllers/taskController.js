const { db } = require("../firebase");
const { Timestamp } = require("firebase-admin/firestore");
const { getDateRange } = require("../utils/dateFilters"); // OK

exports.createTask = async (req, res) => {
  try {
    const createdByUid = req.user.uid;
    const createdByEmpresaId = req.user.empresaId;
    const {
      assignedTo,
      description,
      startTime,
      endTime,
      priority,
      status,
      title,
    } = req.body; // Validate required fields

    if (
      !description ||
      !title ||
      !assignedTo ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Verificar si el usuario 'assignedTo' existe
    const assignedUserDoc = await db.collection('users').doc(assignedTo).get();
    if (!assignedUserDoc.exists) {
        return res.status(404).json({ message: `Assigned user with UID '${assignedTo}' not found.` });
    }
    
    // 2. Verificar que el usuario 'assignedTo' pertenezca a la misma empresa que el administrador
    const assignedUserEmpresaId = assignedUserDoc.data().empresaId;
    if (assignedUserEmpresaId !== createdByEmpresaId) {
        return res.status(403).json({ message: "No autorizado: No puede asignar tareas a usuarios de otras empresas" });
    }

    const newTask = {
      assignedTo,
      createdAt: Timestamp.now(),
      createdBy: createdByUid,
      description,
      endTime: Timestamp.fromDate(new Date(endTime)),
      priority: priority || "normal",
      startTime: Timestamp.fromDate(new Date(startTime)),
      status: status || "pending",
      title,
      realStartTime: null,
      realEndTime: null,
      empresaId: createdByEmpresaId,
    };

    const docRef = await db.collection("tasks").add(newTask);

    return res.status(201).json({ id: docRef.id, ...newTask });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getTasksByUserId = async (req, res) => {
    try {
        const userId = req.params.userId; // El UID del usuario cuyas tareas queremos obtener
        const authenticatedUserEmpresaId = req.user.empresaId; // Empresa ID del usuario que hace la solicitud

        if (!userId) {
            return res.status(400).json({ message: "Missing userId in request parameters." });
        }
        if (!authenticatedUserEmpresaId) {
            return res.status(403).json({ message: "Forbidden: User is not associated with an enterprise." });
        }

        // Construir la consulta a Firestore
        // 1. Filtrar por el usuario asignado
        // 2. Filtrar por la empresa del usuario autenticado (para asegurar que solo se vean tareas de la propia empresa)
        let query = db.collection("tasks")
                      .where("assignedTo", "==", userId)
                      .where("empresaId", "==", authenticatedUserEmpresaId);

        // Opcional: Podrías añadir ordenación, por ejemplo, por fecha de inicio
        // query = query.orderBy("startTime", "asc");

        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(200).json([]); // Devolver un array vacío si no hay tareas para ese usuario en esa empresa
        }

        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Convertir Timestamps a formato de fecha ISO (YYYY-MM-DD) para el cliente
        const formattedTasks = tasks.map(task => {
            const formattedTask = { ...task };
            if (formattedTask.createdAt instanceof Timestamp) {
                formattedTask.createdAt = formattedTask.createdAt.toDate().toISOString().split('T')[0];
            }
            if (formattedTask.startTime instanceof Timestamp) {
                formattedTask.startTime = formattedTask.startTime.toDate().toISOString().split('T')[0];
            }
            if (formattedTask.endTime instanceof Timestamp) {
                formattedTask.endTime = formattedTask.endTime.toDate().toISOString().split('T')[0];
            }
            if (formattedTask.realStartTime instanceof Timestamp && formattedTask.realStartTime !== null) {
                formattedTask.realStartTime = formattedTask.realStartTime.toDate().toISOString().split('T')[0];
            } else if (formattedTask.realStartTime === null) {
                formattedTask.realStartTime = null;
            }
            if (formattedTask.realEndTime instanceof Timestamp && formattedTask.realEndTime !== null) {
                formattedTask.realEndTime = formattedTask.realEndTime.toDate().toISOString().split('T')[0];
            } else if (formattedTask.realEndTime === null) {
                formattedTask.realEndTime = null;
            }
            return formattedTask;
        });

        return res.status(200).json(formattedTasks);

    } catch (error) {
        console.error("Error fetching tasks by user ID:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};