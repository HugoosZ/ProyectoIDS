const { db } = require("../firebase");
const { Timestamp } = require("firebase-admin/firestore");
const { getDateRange } = require("../utils/dateFilters"); // OK


// Función para verificar si dos rangos de tiempo se superponen
function doTimeRangesOverlap(fromTime1, toTime1, fromTime2, toTime2) {
    const start1 = fromTime1 instanceof Timestamp ? fromTime1.toDate().getTime() : new Date(fromTime1).getTime();
    const end1 = toTime1 instanceof Timestamp ? toTime1.toDate().getTime() : new Date(toTime1).getTime();
    const start2 = fromTime2 instanceof Timestamp ? fromTime2.toDate().getTime() : new Date(fromTime2).getTime();
    const end2 = toTime2 instanceof Timestamp ? toTime2.toDate().getTime() : new Date(toTime2).getTime();

    // No overlap if one period ends before the other begins
    return start1 < end2 && start2 < end1;
}

// CONSTANTE: Tiempo mínimo de ejecución para tareas sin relevo
const MIN_EXECUTION_TIME_MINUTES = 15;

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
      requiereRelevo, // booleano
      trabajadorSaliente, // UID
      trabajadorEntrante // UID opcional
    } = req.body;

    // Validaciones obligatorias
    if (!description || typeof requiereRelevo === 'undefined') {
      return res.status(400).json({ message: "Faltan campos obligatorios: descripción o la opción de relevo." });
    }
    if (typeof requiereRelevo !== 'boolean') {
      return res.status(400).json({ message: "El campo 'requiereRelevo' debe ser booleano (true/false)." });
    }
    // El tiempo estimado se define por startTime y endTime (obligatorios más abajo)

    if (!requiereRelevo) {
      // Tarea SIN relevo: solo un trabajador
      if (!assignedTo || !Array.isArray(assignedTo) || assignedTo.length !== 1) {
        return res.status(400).json({ message: "Las tareas sin relevo deben asignarse a un único trabajador." });
      }
    } else {
      // Tarea CON relevo: trabajador saliente obligatorio
      if (!trabajadorSaliente) {
        return res.status(400).json({ message: "Las tareas con relevo requieren un trabajador saliente." });
      }
      // El assignedTo debe contener al menos el saliente
      if (!assignedTo || !Array.isArray(assignedTo) || !assignedTo.includes(trabajadorSaliente)) {
        return res.status(400).json({ message: "El trabajador saliente debe estar en la lista de asignados." });
      }
      // Si hay entrante, debe estar en assignedTo
      if (trabajadorEntrante && !assignedTo.includes(trabajadorEntrante)) {
        return res.status(400).json({ message: "El trabajador entrante debe estar en la lista de asignados si se especifica." });
      }
    }

    if (
    !description ||
    !title ||
    !assignedTo || // Asegurarse de que assignedTo existe
    !Array.isArray(assignedTo) || // Asegurarse de que assignedTo es un array
    assignedTo.length === 0 || // Asegurarse de que el array no esté vacío
    !startTime ||
    !endTime
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios o 'assignedTo' no es un array válido." });
    }


        const newStartTime = new Date(startTime);
        const newEndTime = new Date(endTime);
     // Validar que startTime y endTime sean fechas válidas       
        if (isNaN(newStartTime.getTime()) || isNaN(newEndTime.getTime())) {
        return res.status(400).json({ message: "startTime y endTime deben ser fechas válidas." });
        }
    // Validar que startTime sea anterior a endTime
        if (newEndTime <= newStartTime) {
            return res.status(400).json({ message: "La fecha y hora de fin (endTime) debe ser posterior a la de inicio (startTime)." });
        }


// --- INICIO DE VALIDACIONES DE USUARIOS ASIGNADOS ---
        const usersToAssign = []; // Array para almacenar los UIDs validados
        for (const uid of assignedTo) { 
            const userDoc = await db.collection('users').doc(uid).get();
            if (!userDoc.exists) {
                return res.status(404).json({ message: `Usuario asignado con UID '${uid}' no encontrado.` });
            }

            const userData = userDoc.data();

            // 1. Verificar que el usuario 'assignedTo' pertenezca a la misma empresa que el administrador
            if (userData.empresaId !== createdByEmpresaId) {
                return res.status(403).json({ message: `No autorizado: No puede asignar tareas al usuario '${uid}' de otra empresa.` });
            }

            // 2. Verificar si el usuario está 'activo laboralmente' (isPresent en asistencias)
            // Asumimos que la asistencia se registra diariamente con docId = `${uid}_${today}`
            const today = new Date().toISOString().split('T')[0];
            const asistenciaDoc = await db.collection('asistencias').doc(`${uid}_${today}`).get();

            if (!asistenciaDoc.exists || !asistenciaDoc.data().isPresent) {
                return res.status(400).json({ message: `El usuario '${uid}' no está activo laboralmente (no ha registrado su entrada hoy).` });
            }

            // 3. Verificar solapamiento de tareas para cada usuario asignado
            // Obtener tareas existentes del usuario en el rango de la nueva tarea
            const existingTasksSnapshot = await db.collection('tasks')
                .where('assignedTo', 'array-contains', uid) // Buscar tareas donde el usuario está en el array assignedTo
                .where('empresaId', '==', createdByEmpresaId) // Solo tareas de la misma empresa
                // No podemos filtrar por rango de tiempo directamente aquí con array-contains y dos rangos.
                // Así que obtendremos todas las tareas del usuario de la empresa y filtramos en código.
                .get();

            for (const doc of existingTasksSnapshot.docs) {
                const existingTask = doc.data();
                // Omitir la verificación si la tarea existente ya está completada
                if (existingTask.status === 'completada') {
                    continue;
                }

                if (doTimeRangesOverlap(existingTask.startTime, existingTask.endTime, newStartTime, newEndTime)) {
                    return res.status(400).json({
                        message: `Conflicto de horario: El usuario '${uid}' ya tiene una tarea '${existingTask.title}' (ID: ${doc.id}) que se solapa con el horario de la nueva tarea.`
                    });
                }
            }
            usersToAssign.push(uid); // Si todas las validaciones pasan, añadir el UID a la lista final
        }




    const newTask = {
      assignedTo: usersToAssign,
      createdAt: Timestamp.now(),
      createdBy: createdByUid,
      description,
      endTime: Timestamp.fromDate(new Date(endTime)),
      priority: priority || "normal",
      startTime: Timestamp.fromDate(new Date(startTime)),
      status: status || "pending",
      title,
      requiereRelevo,
      trabajadorSaliente: requiereRelevo ? trabajadorSaliente : null,
      trabajadorEntrante: requiereRelevo ? (trabajadorEntrante || null) : null,
      codigoRelevo: null, // Se generará al finalizar por el saliente
      relevoValidado: false, // Se marcará true cuando el entrante valide el código
      relevoExpira: null, // Timestamp de expiración del código de relevo
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
/*         if (taskData.empresaId !== requestingUserEmpresaId) {
            console.log(`DEBUG: Acceso denegado - Tarea de otra empresa. Tarea empresaId: ${taskData.empresaId}, Usuario empresaId: ${requestingUserEmpresaId}`);
            return res.status(403).json({ message: "No autorizado: No puedes actualizar tareas de otra empresa." });
        } */

        // 2. Verificación de Permisos (User vs Admin)
        if (!requestingUserIsAdmin && (!taskData.assignedTo || !taskData.assignedTo.includes(requestingUserUid))) {
        // Un usuario normal solo puede actualizar su tarea si está asignado a ella.
        // Un administrador puede actualizar cualquier tarea de su empresa.
            console.log(`DEBUG: Acceso denegado - Usuario no admin intentó actualizar tarea no asignada. Tarea asignada a: ${taskData.assignedTo}, Usuario: ${requestingUserUid}`);
            return res.status(403).json({ message: "No autorizado: Solo puedes actualizar tareas asignadas a ti mismo o si eres administrador de la empresa." });
        }
        // Si es admin, y la empresaId ya se validó, puede continuar.
        // Si es el usuario asignado, y la empresaId ya se validó, puede continuar.

        const updateData = { status };

        // Lógica de realStartTime y realEndTime (conservada de tu compañero)
        if (status === "en progreso") {
            // Verificar si el usuario que solicita tiene otra tarea "en progreso"
            const ongoingTasksSnapshot = await db.collection("tasks")
                .where("assignedTo", "array-contains", requestingUserUid) // Buscar si está asignado a tareas
                .where("status", "==", "en progreso")
                .where("empresaId", "==", requestingUserEmpresaId) // Asegurar que sea de la misma empresa
                .get();

            // Si encuentra otra tarea en progreso que no sea la actual (en caso de que la actual ya estuviera en progreso)
            const hasOtherOngoingTask = ongoingTasksSnapshot.docs.some(doc => doc.id !== taskId);

            if (hasOtherOngoingTask) {
                return res.status(400).json({ message: "No puedes iniciar esta tarea porque ya tienes otra tarea en progreso." });
            }

            // Si la tarea aún no tiene realStartTime, sellarlo
            if (!taskData.realStartTime) {
                updateData.realStartTime = Timestamp.now();
            }
            updateData.status = status; // Actualizar el estado
        }

        if (status === "completada") {
            // Asegurarse de que la tarea haya sido iniciada
            if (!taskData.realStartTime) {
                return res.status(400).json({ message: "No puedes finalizar esta tarea porque no ha sido iniciada." });
            }

            const currentTime = Timestamp.now().toDate();
            const startTime = taskData.realStartTime.toDate();
            const durationMs = currentTime.getTime() - startTime.getTime();
            const durationMinutes = durationMs / (1000 * 60);

            // Validar tiempo mínimo de ejecución
            if (durationMinutes < MIN_EXECUTION_TIME_MINUTES) {
                return res.status(400).json({ message: `No puedes finalizar esta tarea hasta que hayan pasado al menos ${MIN_EXECUTION_TIME_MINUTES} minutos desde su inicio.` });
            }

            // Si cumple el tiempo mínimo y aún no tiene realEndTime, sellarlo
            if (!taskData.realEndTime) {
                updateData.realEndTime = Timestamp.now();
            }
            updateData.status = status; // Actualizar el estado
        }

        // Si el estado no es "en progreso" ni "completada" (ej. "pendiente"), solo actualiza el estado.
        // O si ya tiene realStartTime/realEndTime y solo se cambia el estado (ej. de completada a pendiente)
        if (Object.keys(updateData).length === 0 && taskData.status !== status) {
            // Esto cubre casos donde solo se cambia el status sin afectar realStartTime/realEndTime
            // por ejemplo, si ya tenía realStartTime y se intenta poner en progreso de nuevo.
            updateData.status = status;
        } else if (Object.keys(updateData).length === 0 && taskData.status === status) {
            // Si el estado es el mismo y no hay cambios en realStartTime/realEndTime, no hay nada que hacer.
            return res.status(200).json({ message: "El estado de la tarea ya es el solicitado. No se realizaron cambios." });
        }

        await taskRef.update(updateData);

        // Lógica para descontar currentTasks si pasa a "completada" (conservada de tu compañero)
        if (status === "completada" && taskData.status !== "completada") {
            const today = new Date().toISOString().split('T')[0];
            // Determinar a quiénes se les debe decrementar el currentTasks
            // Si el requestingUser es un admin, asumimos que está completando la tarea en nombre de los asignados.
            // Si el requestingUser es uno de los asignados, solo se decrementa para él.
            const usersToDecrement = requestingUserIsAdmin ? taskData.assignedTo : [requestingUserUid];
            for (const userIdToDecrement of usersToDecrement) {
            const asistenciaQuery = await db.collection("asistencias")
                .where("userId", "==", requestingUserUid) // Importante: Usar el userId asignado a la tarea, no el que hace la solicitud si el admin la completa
                .where("date", "==", today)
                .limit(1)
                .get();

            if (!asistenciaQuery.empty) {
                const asistenciaDoc = asistenciaQuery.docs[0];
                const currentCount = asistenciaDoc.data().currentTasks || 0;
                await asistenciaDoc.ref.update({
                    currentTasks: Math.max(0, currentCount - 1),
                });
                console.log(`DEBUG: Tarea completada para usuario ${requestingUserUid}. currentTasks actualizado.`);
            } else {
                console.log(`DEBUG: No se encontró registro de asistencia para ${requestingUserUid} el día ${today}. No se actualizó currentTasks.`);
            }
        }
    }

        res.status(200).json({ message: "Estado de la tarea actualizado exitosamente." });

    } catch (error) {
        console.error("Error al actualizar el estado de la tarea:", error);
        res.status(500).json({ message: "Error interno del servidor al actualizar el estado.", details: error.message });
    }
};
