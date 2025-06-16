const { db } = require("../firebase");
const admin = require('firebase-admin');
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
    const createdByUid        = req.user.uid;
    const createdByEmpresaId  = req.user.empresaId;
    const {
      assignedTo,
      description,
      startTime,
      endTime,
      priority,
      status,
      title,
      requiereRelevo,
      trabajadorSaliente,
      trabajadorEntrante
    } = req.body;

    // — aquí tus validaciones anteriores de campos, fechas, solapamientos, etc. —

    // 1) Crear el documento de task
    const newTask = {
      createdAt:   admin.firestore.Timestamp.now(),
      createdBy:   createdByUid,
      description,
      startTime:   admin.firestore.Timestamp.fromDate(new Date(startTime)),
      endTime:     admin.firestore.Timestamp.fromDate(new Date(endTime)),
      priority:    priority   || 'baja',
      status:      status     || 'pendiente',
      title,
      empresaId:   createdByEmpresaId,
      requiereRelevo,
      haTenidoRelevo: false,
    };

    const taskRef = await db.collection('tasks').add(newTask);
    const taskId  = taskRef.id;

    // 2) Crear asignaciones en la colección intermedia
    const batch = db.batch();
      const assignmentRef = db.collection('taskAssignments').doc();

      batch.set(assignmentRef, {
        taskId,
        userId: assignedTo,
        validadoRelevo: false,
        timestampAsignado: admin.firestore.Timestamp.now(),
        trabajadorSaliente: requiereRelevo ? trabajadorSaliente : null,
        trabajadorEntrante: requiereRelevo ? trabajadorEntrante  : null,
        codigoRelevo:       null,
        relevoExpira:       null,
        relevoValidado:     false
      });
    await batch.commit();

    return res.status(201).json({ id: taskId, ...newTask });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
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

// Genera un código numérico aleatorio de 6 dígitos
function generate6DigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.generarCodigoRelevo = async (req, res) => {
  try {
    const { taskId }                        = req.params;
    const { uid: userUid, empresaId, isAdmin } = req.user;
    const { minutosValidez }                = req.body;

    if (!minutosValidez || isNaN(minutosValidez) || minutosValidez <= 0) {
      return res.status(400).json({ message: 'minutosValidez debe ser un número > 0.' });
    }

    // 1.1) Verifico tarea y permisos
    const taskRef = db.collection('tasks').doc(taskId);
    const taskSnap= await taskRef.get();
    if (!taskSnap.exists) 
      return res.status(404).json({ message: 'Tarea no encontrada.' });

    const task = taskSnap.data();
    if (task.empresaId !== empresaId) 
      return res.status(403).json({ message: 'No autorizado sobre esta tarea.' });

    if (!isAdmin && task.createdBy !== userUid) 
      return res.status(403).json({ message: 'Sólo admin o creador pueden generar código.' });

    if (!task.requiereRelevo) 
      return res.status(400).json({ message: 'La tarea no está marcada como relevo.' });


    // 1.2) Recupero el único assignment para esta tarea
    const asgSnap = await db.collection('taskAssignments')
      .where('taskId', '==', taskId)
      .limit(1)
      .get();
    if (asgSnap.empty) 
      return res.status(404).json({ message: 'Asignación no encontrada.' });

    const asgDoc = asgSnap.docs[0];
    const asgRef = asgDoc.ref;

    // 1.3) Generar y guardar el código + expiración
    const code      = generate6DigitCode();
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + minutosValidez * 60000)
    );

    await asgRef.update({
      codigoRelevo:   code,
      relevoExpira:   expiresAt,
      validadoRelevo: false
    });

    return res.status(200).json({ code, expiresAt });
  } catch (error) {
    console.error('Error generando código de relevo:', error);
    return res.status(500).json({ message: 'Error interno al generar código.' });
  }
};

exports.realizarRelevo = async (req, res) => {
  try {
    const { taskId }                  = req.params;
    const { codigoIngresado }         = req.body;
    const { uid: nuevoUid, empresaId } = req.user;
    const now = admin.firestore.Timestamp.now();

    if (!codigoIngresado) {
      return res.status(400).json({ message: 'Código de relevo requerido.' });
    }

    // 2.1) Verifico tarea
    const taskRef = db.collection('tasks').doc(taskId);
    const taskSnap= await taskRef.get();
    if (!taskSnap.exists) 
      return res.status(404).json({ message: 'Tarea no encontrada.' });

    const task = taskSnap.data();
    if (task.empresaId !== empresaId) 
      return res.status(403).json({ message: 'Tarea de otra empresa.' });
    if (!task.requiereRelevo) 
      return res.status(400).json({ message: 'La tarea no requiere relevo.' });


    // 2.2) Recupero el assignment
    const asgSnap = await db.collection('taskAssignments')
      .where('taskId', '==', taskId)
      .limit(1)
      .get();
    if (asgSnap.empty) 
      return res.status(404).json({ message: 'Asignación no encontrada.' });

    const asgDoc = asgSnap.docs[0];
    const asg   = asgDoc.data();
    const asgRef= asgDoc.ref;

    // 2.3) Valido código y expiración
    if (!asg.codigoRelevo || asg.codigoRelevo !== codigoIngresado) {
      return res.status(400).json({ message: 'Código incorrecto.' });
    }
    if (!asg.relevoExpira || asg.relevoExpira.toDate() < new Date()) {
      return res.status(400).json({ message: 'El código ha expirado.' });
    }

    // 2.4) Actualizo el assignment: marco entrante y valido relevo
    await asgRef.update({
      userId:          nuevoUid,
      trabajadorEntrante: nuevoUid,
      validadoRelevo:  true,
      timestampAsignado: now
    });

    // 2.5) Actualizo la tarea para reflejar que el relevo se completó
    await taskRef.update({
      relevoValidado: true,
      haTenidoRelevo: true,
      // Opcional: podrías borrar el código y la expiración
      codigoRelevo:   admin.firestore.FieldValue.delete(),
      relevoExpira:   admin.firestore.FieldValue.delete()
    });

    return res.status(200).json({ message: 'Relevo validado correctamente.' });
  } catch (error) {
    console.error('Error al realizar el relevo:', error);
    return res.status(500).json({ message: 'Error interno al procesar el relevo.' });
  }
};




exports.getDailyTaskStatus = async (req, res) => {
  try {
    const { empresaId } = req.user;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const tasksSnapshot = await db.collection('tasks')
      .where('empresaId', '==', empresaId)
      .get();

    const tasks = [];

    for (const doc of tasksSnapshot.docs) {
      const task = doc.data();
      task.id = doc.id;

      //Filtrar en memoria solo tareas que inician hoy
      if (!task.startTime || !(task.startTime.toDate instanceof Function)) continue;

      const taskStartTime = task.startTime.toDate();
      if (taskStartTime < today || taskStartTime >= tomorrow) continue;

      // Obtener información de los trabajadores asignados
      const assignedWorkers = [];
      if (Array.isArray(task.assignedTo)) {
        for (const uid of task.assignedTo) {
          const userDoc = await db.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            assignedWorkers.push({
              uid,
              name: userData.name,
              lastName: userData.lastName,
            });
          }
        }
      } else if (typeof task.assignedTo === 'string') {
        const userDoc = await db.collection('users').doc(task.assignedTo).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          assignedWorkers.push({
            uid: task.assignedTo,
            name: userData.name,
            lastName: userData.lastName,
          });
        }
      }

      // Agregar información de relevo si aplica
      let relevoInfo = null;
      if (task.requiereRelevo) {
        const trabajadorSalienteDoc = task.trabajadorSaliente
          ? await db.collection('users').doc(task.trabajadorSaliente).get()
          : null;
        const trabajadorEntranteDoc = task.trabajadorEntrante
          ? await db.collection('users').doc(task.trabajadorEntrante).get()
          : null;

        relevoInfo = {
          trabajadorSaliente: trabajadorSalienteDoc?.exists
            ? {
                uid: task.trabajadorSaliente,
                name: trabajadorSalienteDoc.data().name,
                lastName: trabajadorSalienteDoc.data().lastName,
              }
            : null,
          trabajadorEntrante: trabajadorEntranteDoc?.exists
            ? {
                uid: task.trabajadorEntrante,
                name: trabajadorEntranteDoc.data().name,
                lastName: trabajadorEntranteDoc.data().lastName,
              }
            : null,
          relevoValidado: task.relevoValidado || false,
        };
      }

      tasks.push({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        startTime: task.startTime.toDate(),
        endTime: task.endTime?.toDate() || null,
        assignedWorkers,
        relevoInfo,
        isGroupTask: Array.isArray(task.assignedTo) && task.assignedTo.length > 1,
      });
    }

    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Error al obtener el estado diario de las tareas:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Controlador para asignar tareas individuales o grupales
exports.AssignTask = async (req, res) => {
  try {
    // Extraer datos principales del request
    const { isGroupTask, taskId, startTime, endTime, priority, status, requiereRelevo, participantAssignments, assignedTo, individualTask } = req.body;
    // Construir objeto base para TaskInfo (tarea general)
    const taskInfoData = {
      taskId: taskId, // Referencia a la plantilla de tarea
      startTime: startTime ? new Date(startTime) : null, // Tiempo general de inicio
      endTime: endTime ? new Date(endTime) : null, // Tiempo general de término
      priority: priority || "normal",
      status: status || "pendiente",
      requiereRelevo: typeof requiereRelevo === 'boolean' ? requiereRelevo : false,
      isGroupTask: !!isGroupTask,
      isFinished: false,
      participants: [],
      shouldBeWorking: null,
      currentlyWorking: null,
      createdAt: new Date()
    };

    // Unificar participantAssignments para todos los casos
    let participantsArray = [];
    if (isGroupTask) {
      // Caso 1: Tarea grupal (varios usuarios, cada uno con su subtarea)
      if (!Array.isArray(participantAssignments) || participantAssignments.length === 0) {
        return res.status(400).json({ error: "Se requieren los participantes con sus tareas individuales." });
      }
      participantsArray = participantAssignments;
    } else if (requiereRelevo === true) {
      // Caso 2: Tarea individual con relevo (varios usuarios, cada uno con su subtarea)
      if (!Array.isArray(participantAssignments) || participantAssignments.length === 0) {
        return res.status(400).json({ error: "Se requieren los participantes con sus tareas individuales para el relevo." });
      }
      participantsArray = participantAssignments;
    } else {
      // Caso 3: Tarea individual sin relevo (un solo usuario, una sola asignación)
      if (!assignedTo) {
        return res.status(400).json({ error: "Se requiere el usuario asignado." });
      }
      participantsArray = [{
        userId: assignedTo,
        individualTask: individualTask || null,
        startTimeIndividualTask: startTime ? new Date(startTime) : null,
        endTimeIndividualTask: endTime ? new Date(endTime) : null
      }];
    }

    // Validación estricta de tiempos generales (TaskInfo)
    if (!startTime || !endTime) {
      return res.status(400).json({ error: "Se requiere startTime y endTime para la tarea general." });
    }
    if (isNaN(new Date(startTime)) || isNaN(new Date(endTime))) {
      return res.status(400).json({ error: "startTime o endTime no son fechas válidas." });
    }
    if (new Date(startTime).getTime() === new Date(endTime).getTime()) {
      return res.status(400).json({ error: "El tiempo de inicio y término de la tarea general no pueden ser iguales." });
    }
    if (new Date(startTime) > new Date(endTime)) {
      return res.status(400).json({ error: "El tiempo de inicio de la tarea general no puede ser mayor que el de término." });
    }

    // Verificar que todos los participantes existen en la base de datos
    const notFound = [];
    for (const assignment of participantsArray) {
      const { userId } = assignment;
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        notFound.push(userId);
      }
    }
    if (notFound.length > 0) {
      return res.status(404).json({ error: `Usuarios no encontrados: ${notFound.join(", ")}` });
    }

    // Validar solapamiento de tareas para cada participante
    for (const assignment of participantsArray) {
      const { userId, startTimeIndividualTask, endTimeIndividualTask } = assignment;
      // Buscar tareas asignadas al usuario que se solapen con el nuevo rango
      const overlappingTasks = await db.collection("tasksAssignments")
        .where("assignedTo", "==", userId)
        .where("startTimeIndividualTask", "<", new Date(endTimeIndividualTask))
        .where("endTimeIndividualTask", ">", new Date(startTimeIndividualTask))
        .get();
      if (!overlappingTasks.empty) {
        return res.status(400).json({ error: `El usuario ${userId} ya tiene una tarea asignada en el rango de tiempo solicitado.` });
      }
    }

    // Guardar los participantes en TaskInfo
    taskInfoData.participants = participantsArray.map(a => a.userId);
    // Crear documento en la colección TaskInfo (tarea general)
    const taskInfoRef = await db.collection("taskInfo").add(taskInfoData);
    // Crear tareas individuales en la colección tasksAssignments
    const assignments = [];
    for (const assignment of participantsArray) {
      const { userId, individualTask, startTimeIndividualTask, endTimeIndividualTask } = assignment;
      // Validaciones de tiempo para cada asignación individual
      if (!startTimeIndividualTask || !endTimeIndividualTask) {
        return res.status(400).json({ error: `Se requiere startTimeIndividualTask y endTimeIndividualTask para la asignación de ${userId}.` });
      }
      if (isNaN(new Date(startTimeIndividualTask)) || isNaN(new Date(endTimeIndividualTask))) {
        return res.status(400).json({ error: `startTimeIndividualTask o endTimeIndividualTask de ${userId} no son fechas válidas.` });
      }
      if (new Date(startTimeIndividualTask) < new Date(startTime)) {
        return res.status(400).json({ error: `El startTimeIndividualTask de ${userId} es menor que el startTime general.` });
      }
      if (new Date(endTimeIndividualTask) > new Date(endTime)) {
        return res.status(400).json({ error: `El endTimeIndividualTask de ${userId} es mayor que el endTime general.` });
      }
      if (new Date(startTimeIndividualTask).getTime() === new Date(endTimeIndividualTask).getTime()) {
        return res.status(400).json({ error: `El tiempo de inicio y término de la tarea individual de ${userId} no pueden ser iguales.` });
      }
      if (new Date(startTimeIndividualTask) > new Date(endTimeIndividualTask)) {
        return res.status(400).json({ error: `El tiempo de inicio de la tarea individual de ${userId} no puede ser mayor que el de término.` });
      }
      // Solo para tareas grupales o individuales con relevo, no permite que los tiempos individuales sean exactamente iguales a los generales
      if ((isGroupTask || requiereRelevo === true) &&
        startTimeIndividualTask && endTimeIndividualTask &&
        new Date(startTimeIndividualTask).getTime() === new Date(startTime).getTime() &&
        new Date(endTimeIndividualTask).getTime() === new Date(endTime).getTime()
      ) {
        return res.status(400).json({ error: `El tiempo de la tarea individual de ${userId} no puede ser exactamente igual al tiempo general.` });
      }
      // Heredar nombre y descripción del taskId solo para tarea individual sin relevo
      let extraFields = {};
      if (!isGroupTask && requiereRelevo !== true) {
        const taskDoc = await db.collection("tasks").doc(taskId).get();
        const taskData = taskDoc.exists ? taskDoc.data() : {};
        extraFields = {
          individualTask: taskData.title || null,
          description: taskData.description || null
        };
      }
      // Construir documento de asignación individual
      const assignmentDoc = {
        taskInfoId: taskInfoRef.id,
        assignedTo: userId,
        startTimeIndividualTask: startTimeIndividualTask ? new Date(startTimeIndividualTask) : null,
        endTimeIndividualTask: endTimeIndividualTask ? new Date(endTimeIndividualTask) : null,
        priority: priority || "normal",
        status: status || "pendiente",
        requiereRelevo: typeof requiereRelevo === 'boolean' ? requiereRelevo : false,
        individualTask: individualTask || null,
        isGroupTask: !!isGroupTask,
        createdAt: new Date(),
        ...extraFields
      };
      await db.collection("taskAssignments").add(assignmentDoc);
      assignments.push(assignmentDoc);
    }
    // Respuesta exitosa
    res.status(201).json({ message: "Tarea registrada en taskInfo y tareas individuales creadas en taskAssignments", taskInfoId: taskInfoRef.id, ...taskInfoData, assignments });
  } catch (error) {
    // Manejo de errores generales
    console.error("Error al asignar tarea:", error);
    res.status(500).json({ error: "Error interno al asignar la tarea" });
  }
};
