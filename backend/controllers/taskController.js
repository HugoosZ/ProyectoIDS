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
        const userEmpresaId = req.user.empresaId;

        if (!userEmpresaId) {
            return res.status(403).json({ message: "Forbidden: User is not associated with an enterprise." });
        }

        let query = db.collection("tasks").where("empresaId", "==", userEmpresaId);

        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

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

        return res.status(200).json(formattedTasks);

    } catch (error) {
        console.error("Error fetching all company tasks:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.updateTaskStatus = async (req, res) => { // Renombrada de 'updateTask' a 'updateTaskStatus' para ser más específica
    try {
        const { taskId } = req.params;
        const { status } = req.body;
        const { uid: requestingUserUid, empresaId: requestingUserEmpresaId, isAdmin: requestingUserIsAdmin } = req.user;

        if (!taskId) {
            return res.status(400).json({ message: "Task ID is required." });
        }
        if (!status) {
            return res.status(400).json({ message: "Status is required for update." });
        }

        const validStatuses = ["pendiente", "en progreso", "completada"]; // Cuidado con tildes si se usan en la DB
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Estado inválido. Los estados permitidos son: 'pendiente', 'en progreso', 'completada'." });
        }

        const taskRef = db.collection("tasks").doc(taskId);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            return res.status(404).json({ message: "Tarea no encontrada." });
        }

        const taskData = taskDoc.data();

        // 1. Verificación de EmpresaId (Obligatorio para cualquier operación)
        if (taskData.empresaId !== requestingUserEmpresaId) {
            console.log(`DEBUG: Acceso denegado - Tarea de otra empresa. Tarea empresaId: ${taskData.empresaId}, Usuario empresaId: ${requestingUserEmpresaId}`);
            return res.status(403).json({ message: "No autorizado: No puedes actualizar tareas de otra empresa." });
        }

        // 2. Verificación de Permisos (User vs Admin)
        if (!requestingUserIsAdmin && taskData.assignedTo !== requestingUserUid) {
            // Si no es admin Y la tarea no le está asignada, denegar.
            console.log(`DEBUG: Acceso denegado - Usuario no admin intentó actualizar tarea no asignada. Tarea asignada a: ${taskData.assignedTo}, Usuario: ${requestingUserUid}`);
            return res.status(403).json({ message: "No autorizado: Solo puedes actualizar tareas asignadas a ti mismo o si eres administrador de la empresa." });
        }
        // Si es admin, y la empresaId ya se validó, puede continuar.
        // Si es el usuario asignado, y la empresaId ya se validó, puede continuar.

        const updateData = { status };

        // Lógica de realStartTime y realEndTime (conservada de tu compañero)
        if (status === "en progreso" && !taskData.realStartTime) {
            updateData.realStartTime = Timestamp.now();
        }
        if (status === "completada" && !taskData.realEndTime) {
            updateData.realEndTime = Timestamp.now();
        }

        await taskRef.update(updateData);

        // Lógica para descontar currentTasks si pasa a "completada" (conservada de tu compañero)
        if (status === "completada" && taskData.status !== "completada") {
            const today = new Date().toISOString().split('T')[0];
            const asistenciaQuery = await db.collection("asistencias")
                .where("userId", "==", taskData.assignedTo) // Importante: Usar el userId asignado a la tarea, no el que hace la solicitud si el admin la completa
                .where("date", "==", today)
                .limit(1)
                .get();

            if (!asistenciaQuery.empty) {
                const asistenciaDoc = asistenciaQuery.docs[0];
                const currentCount = asistenciaDoc.data().currentTasks || 0;
                await asistenciaDoc.ref.update({
                    currentTasks: Math.max(0, currentCount - 1),
                });
                console.log(`DEBUG: Tarea completada para usuario ${taskData.assignedTo}. currentTasks actualizado.`);
            } else {
                console.log(`DEBUG: No se encontró registro de asistencia para ${taskData.assignedTo} el día ${today}. No se actualizó currentTasks.`);
            }
        }

        res.status(200).json({ message: "Estado de la tarea actualizado exitosamente." });

    } catch (error) {
        console.error("Error al actualizar el estado de la tarea:", error);
        res.status(500).json({ message: "Error interno del servidor al actualizar el estado.", details: error.message });
    }
};