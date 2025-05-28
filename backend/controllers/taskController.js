const { db } = require("../firebase");
const { Timestamp } = require("firebase-admin/firestore");
const { getDateRange } = require("../utils/dateFilters"); // OK

exports.createTask = async (req, res) => {
  try {
    const createdByUid = req.user.uid;
    //const createdByEmpresaId = req.user.empresaId;
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
/*     const assignedUserEmpresaId = assignedUserDoc.data().empresaId;
    if (assignedUserEmpresaId !== createdByEmpresaId) {
        return res.status(403).json({ message: "No autorizado: No puede asignar tareas a usuarios de otras empresas" });
    } */

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
      //empresaId: createdByEmpresaId,
    };

    const docRef = await db.collection("tasks").add(newTask);
    // Seccion para aumentar el contador de tareas actuales del usuario asignado
    // Actualizar la asistencia del usuario asignado
    const today = new Date().toISOString().split('T')[0];

    // Buscar la asistencia del usuario para hoy
    const asistenciaQuery = await db.collection('asistencias')
      .where('userId', '==', assignedTo)
      .where('date', '==', today)
      .limit(1)
      .get();

    if (!asistenciaQuery.empty) {
      const asistenciaDoc = asistenciaQuery.docs[0];
      const currentCount = asistenciaDoc.data().currentTasks || 0;

      await asistenciaDoc.ref.update({
        currentTasks: currentCount + 1
      });
    } else {
      // Crear la asistencia con currentTasks = 1
      await db.collection('asistencias').add({
        userId: assignedTo,
        date: today,
        currentTasks: 1,
        checkInTime: null,
        checkOutTime: null
      });
    }
    
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

exports.getAllCompanyTasks = async (req, res) => {
    try {
        console.log("ola")
        const userEmpresaId = req.user.empresaId;

        if (!userEmpresaId) {
            return res.status(403).json({ message: "Forbidden: User is not associated with an enterprise." });
        }

        let query = db.collection("tasks").where("empresaId", "==", userEmpresaId);

        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }
        console.log("ola2")
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Convertir Timestamps a formato legible (solo fecha, YYYY-MM-DD)
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
        console.log("ola3")
        return res.status(200).json(formattedTasks);

    } catch (error) {
        console.error("Error fetching all company tasks:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};