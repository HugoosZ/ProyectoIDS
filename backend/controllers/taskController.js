const { db } = require("../firebase");
const admin = require('firebase-admin');
const { Timestamp } = require("firebase-admin/firestore");
const { getDateRange } = require("../utils/dateFilters"); // OK
const { decrypt } = require("../utils/crypto"); 


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
//CONSTANTE: Umbral de porcentaje de completado para enviar alerta al frontend
const COMPLETION_ALERT_THRESHOLD_PERCENTAGE = 70; 

// **Función auxiliar para recalcular y actualizar shouldBeWorking y currentlyWorking en taskInfo**
// Esta función será llamada cuando haya un cambio relevante en taskAssignments
async function updateDynamicTaskInfoStatus(taskInfoId) {
    try {
        const taskInfoRef = db.collection("taskInfo").doc(taskInfoId);
        const taskInfoDoc = await taskInfoRef.get();

        if (!taskInfoDoc.exists) {
            console.warn(`WARN: taskInfo ${taskInfoId} no encontrada para actualización dinámica.`);
            return;
        }

        const assignmentsSnapshot = await db.collection("taskAssignments")
            .where("taskInfoId", "==", taskInfoId)
            .get();

        const currentTime = new Date();
        const shouldBeWorkingUids = [];
        const currentlyWorkingUids = [];

        for (const assignmentDoc of assignmentsSnapshot.docs) {
            const assignmentData = assignmentDoc.data();
            const individualStartTime = assignmentData.startTimeIndividualTask ? assignmentData.startTimeIndividualTask.toDate() : null;
            const individualEndTime = assignmentData.endTimeIndividualTask ? assignmentData.endTimeIndividualTask.toDate() : null;

            if (individualStartTime && individualEndTime &&
                currentTime >= individualStartTime &&
                currentTime <= individualEndTime) {
                if (!shouldBeWorkingUids.includes(assignmentData.assignedTo)) {
                    shouldBeWorkingUids.push(assignmentData.assignedTo);
                }
                if (assignmentData.status === "en progreso" && !currentlyWorkingUids.includes(assignmentData.assignedTo)) {
                    currentlyWorkingUids.push(assignmentData.assignedTo);
                }
            }
        }
        
        // Actualizar el documento taskInfo con los nuevos arrays
        await taskInfoRef.update({
            shouldBeWorking: shouldBeWorkingUids,
            currentlyWorking: currentlyWorkingUids,
        });
        console.log(`DEBUG: shouldBeWorking y currentlyWorking actualizados para taskInfo ${taskInfoId}.`);

    } catch (error) {
        console.error(`Error al actualizar shouldBeWorking y currentlyWorking para taskInfo ${taskInfoId}:`, error);
    }
}

async function getUserDataAndDecrypt(uid) {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        return null;
    }
    const userData = userDoc.data();
    // Desencriptar los campos si están encriptados
    let name = userData.name;
    let lastName = userData.lastName;
    let rut = userData.rut;
    try { name = decrypt(name); } catch (e) { /* console.warn("Error desencriptando nombre:", e.message); */ }
    try { lastName = decrypt(lastName); } catch (e) { /* console.warn("Error desencriptando apellido:", e.message); */ }
    try { rut = decrypt(rut); } catch (e) { /* console.warn("Error desencriptando RUT:", e.message); */ }

    // Retornar los datos del usuario con los campos desencriptados
    return {
        uid: userDoc.id,
        email: userData.email,
        role: userData.role,
        isAdmin: userData.isAdmin,
        empresaId: userData.empresaId,
        createdAt: userData.createdAt instanceof Timestamp ? userData.createdAt.toDate().toISOString() : userData.createdAt,
        name,
        lastName,
        rut
    };
}

// Crear tarea (solo campos base)
exports.createTask = async (req, res) => {
  try {
    const { uid: createdByUid, empresaId: createdByEmpresaId } = req.user;
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Título y descripción son requeridos.' });
    }

    const newTask = {
      title,
      description,
      createdAt:  admin.firestore.Timestamp.now(),
      createdBy:  createdByUid,
      empresaId:  createdByEmpresaId,
    };

    const taskRef = await db.collection('tasks').add(newTask);

    return res.status(201).json({ id: taskRef.id, ...newTask });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Error al crear la tarea.' });
  }
};


exports.getTasksByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    const authenticatedUserEmpresaId = req.user.empresaId;

    if (!userId) {
      return res.status(400).json({ message: "Falta el userId en los parámetros." });
    }
    if (!authenticatedUserEmpresaId) {
      return res.status(403).json({ message: "Usuario no asociado a una empresa." });
    }

    // 1. Buscar asignaciones del usuario
    const assignmentsSnap = await db.collection("taskAssignments")
      .where("assignedTo", "==", userId)
      .get();

    if (assignmentsSnap.empty) {
      return res.status(200).json([]); // No hay tareas asignadas a este usuario
    }

    const tasks = [];

    // 2. Recorrer asignaciones y obtener la info completa de cada tarea
    for (const doc of assignmentsSnap.docs) {
      const assignmentData = doc.data();
      const assignmentId = doc.id;

      const taskInfoRef = db.collection("taskInfo").doc(assignmentData.taskInfoId);
      const taskInfoSnap = await taskInfoRef.get();

      if (!taskInfoSnap.exists) continue;

      const taskInfo = taskInfoSnap.data();

      // Verificar empresa
      if (taskInfo.empresaId !== authenticatedUserEmpresaId) continue;

      // Formatear fechas (Timestamps a ISO)
      const formatDate = (timestamp) =>
        timestamp instanceof admin.firestore.Timestamp
          ? timestamp.toDate().toISOString().split("T")[0]
          : null;

      tasks.push({
        assignmentId,
        taskInfoId: assignmentData.taskInfoId,
        assignedTo: assignmentData.assignedTo,
        individualTask: assignmentData.individualTask || null,
        status: assignmentData.status,
        startTimeIndividualTask: formatDate(assignmentData.startTimeIndividualTask),
        endTimeIndividualTask: formatDate(assignmentData.endTimeIndividualTask),
        // Info general
        taskName: taskInfo.taskName || null, // puedes usar otro campo representativo
        empresaId: taskInfo.empresaId,
        priority: taskInfo.priority,
        startTime: formatDate(taskInfo.startTime),
        endTime: formatDate(taskInfo.endTime),
        createdAt: formatDate(taskInfo.createdAt),
        isGroupTask: taskInfo.isGroupTask,
        requiereRelevo: taskInfo.requiereRelevo,
      });
    }

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Error al obtener tareas por usuario:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
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

exports.updateTaskStatus = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { status } = req.body;
        const { uid: requestingUserUid, empresaId: requestingUserEmpresaId, isAdmin: requestingUserIsAdmin } = req.user;

        if (!assignmentId) {
            return res.status(400).json({ message: "Assignment ID es requerido." });
        }
        if (!status) {
            return res.status(400).json({ message: "El estado es requerido para la actualización." });
        }

        const validStatuses = ["pendiente", "en progreso", "completada"]; 
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Estado inválido. Los estados permitidos son: 'pendiente', 'en progreso', 'completada'." });
        }

        const assignmentRef = db.collection("taskAssignments").doc(assignmentId);
        const assignmentDoc = await assignmentRef.get();

        if (!assignmentDoc.exists) {
            return res.status(404).json({ message: "Asignación de tarea no encontrada." });
        }

        const assignmentData = assignmentDoc.data();

        const taskInfoRef = db.collection("taskInfo").doc(assignmentData.taskInfoId);
        const taskInfoDoc = await taskInfoRef.get();

        if (!taskInfoDoc.exists) {
            return res.status(404).json({ message: "Tarea principal (taskInfo) asociada no encontrada." });
        }
        const taskInfoData = taskInfoDoc.data();

        if (taskInfoData.empresaId !== requestingUserEmpresaId) {
            console.log(`DEBUG: Acceso denegado - Tarea de otra empresa. Tarea empresaId: ${taskInfoData.empresaId}, Usuario empresaId: ${requestingUserEmpresaId}`);
            return res.status(403).json({ message: "No autorizado: No puedes actualizar asignaciones de tareas de otra empresa." });
        }

        if (!requestingUserIsAdmin && assignmentData.assignedTo !== requestingUserUid) {
            console.log(`DEBUG: Acceso denegado - Usuario no admin intentó actualizar asignación no propia. Asignado a: ${assignmentData.assignedTo}, Usuario solicitante: ${requestingUserUid}`);
            return res.status(403).json({ message: "No autorizado: Sólo puedes actualizar tus propias asignaciones o si eres administrador de la empresa." });
        }

        const updateData = { status };

        if (status === "en progreso") {
            const ongoingAssignmentsSnapshot = await db.collection("taskAssignments")
                .where("assignedTo", "==", requestingUserUid)
                .where("status", "==", "en progreso")
                .get();

            const hasOtherOngoingAssignment = ongoingAssignmentsSnapshot.docs.some(doc => doc.id !== assignmentId);
            if (hasOtherOngoingAssignment) {
                return res.status(400).json({ message: "No puedes iniciar esta asignación porque ya tienes otra tarea en progreso." });
            }

            if (!assignmentData.realStartTime) {
                updateData.realStartTime = Timestamp.now();
            }
        }

        if (status === "completada") {
            if (!assignmentData.realStartTime) {
                return res.status(400).json({ message: "No puedes finalizar esta asignación porque no ha sido iniciada." });
            }

            const currentTime = Timestamp.now().toDate();
            const startTime = assignmentData.realStartTime.toDate();
            const durationMs = currentTime.getTime() - startTime.getTime();
            const durationMinutes = durationMs / (1000 * 60);

            if (durationMinutes < MIN_EXECUTION_TIME_MINUTES) {
                return res.status(400).json({ message: `No puedes finalizar esta asignación hasta que hayan pasado al menos ${MIN_EXECUTION_TIME_MINUTES} minutos desde su inicio.` });
            }

            if (!assignmentData.realEndTime) {
                updateData.realEndTime = Timestamp.now();
            }
        }

        if (Object.keys(updateData).length === 1 && updateData.status === assignmentData.status) {
            return res.status(200).json({ message: "El estado de la asignación de tarea ya es el solicitado. No se realizaron cambios." });
        }

        await assignmentRef.update(updateData);

        if (status === "completada" && assignmentData.status !== "completada") {
            const today = new Date().toISOString().split('T')[0];
            const userIdToDecrement = assignmentData.assignedTo; 

            const asistenciaQuery = await db.collection("asistencias")
                .where("userId", "==", userIdToDecrement) 
                .where("date", "==", today)
                .limit(1)
                .get();

            if (!asistenciaQuery.empty) {
                const asistenciaDoc = asistenciaQuery.docs[0];
                const currentCount = asistenciaDoc.data().currentTasks || 0;
                await asistenciaDoc.ref.update({
                    currentTasks: Math.max(0, currentCount - 1),
                });
                console.log(`DEBUG: Asignación finalizada para usuario ${userIdToDecrement}. currentTasks actualizado.`);
            } else {
                console.log(`DEBUG: No se encontró registro de asistencia para ${userIdToDecrement} el día ${today}. No se actualizó currentTasks.`);
            }
        }

        // === Lógica para Finalizar Tarea Grupal Y RECALCULAR shouldBeWorking/currentlyWorking ===
        // Llamar a la función auxiliar para actualizar los campos dinámicos
        await updateDynamicTaskInfoStatus(assignmentData.taskInfoId); 

        // --- INICIO: Lógica para alerta de progreso al frontend ---
        const allRelatedAssignmentsSnapshot = await db.collection("taskAssignments")
            .where("taskInfoId", "==", assignmentData.taskInfoId)
            .get();

        const totalAssignments = allRelatedAssignmentsSnapshot.docs.length;
        const completedAssignments = allRelatedAssignmentsSnapshot.docs.filter(doc => doc.data().status === "finalizada").length;
        
        let completionPercentage = 0;
        if (totalAssignments > 0) {
            completionPercentage = (completedAssignments / totalAssignments) * 100;
        }

        let sendCompletionAlert = false;
        // Solo enviar alerta si es tarea grupal, no está ya finalizada y se cruza el umbral
        if (totalAssignments > 0 && completionPercentage >= COMPLETION_ALERT_THRESHOLD_PERCENTAGE && taskInfoData.isGroupTask && !taskInfoData.isFinished) {
            sendCompletionAlert = true;
        }
        // --- FIN: Lógica para alerta de progreso al frontend ---


        const allAssignmentsAreCompleted = allRelatedAssignmentsSnapshot.docs.every(doc => doc.data().status === "completada");

        if (allAssignmentsAreCompleted) {
            await taskInfoRef.update({
                status: "completada",
                isFinished: true 
            });
            console.log(`DEBUG: Tarea principal (taskInfo) ${assignmentData.taskInfoId} marcada como 'completada' porque todas sus asignaciones individuales están completadas.`);
        }
        
        // La respuesta ahora incluye 'sendCompletionAlert' y 'currentCompletionPercentage'
        res.status(200).json({ 
            message: "Estado de la asignación de tarea actualizado exitosamente.",
            sendCompletionAlert: sendCompletionAlert,
            currentCompletionPercentage: completionPercentage 
        });

    } catch (error) {
        console.error("Error al actualizar el estado de la asignación de tarea:", error);
        res.status(500).json({ message: "Error interno del servidor al actualizar el estado de la asignación.", details: error.message });
    }
};

// Genera un código numérico aleatorio de 6 dígitos
function generate6DigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.generarCodigoRelevo = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { uid: userUid, empresaId, isAdmin } = req.user;
    const { minutosValidez } = req.body;

    if (!minutosValidez || isNaN(minutosValidez) || minutosValidez <= 0) {
      return res.status(400).json({ message: 'minutosValidez debe ser un número > 0.' });
    }

    // 1. Obtener tarea individual desde taskAssignments
    const taskRef = db.collection('taskAssignments').doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    const task = taskSnap.data();

    // 2. Validar permisos y que la tarea sea de relevo
    if (!task.requiereRelevo) {
      return res.status(400).json({ message: 'La tarea no requiere relevo.' });
    }

    if (!isAdmin && task.assignedTo !== userUid) {
      return res.status(403).json({ message: 'Sólo admin o el asignado pueden generar el código de relevo.' });
    }

    // 3. Obtener la tarea general (taskInfo)
    const taskInfoId = task.taskInfoId;
    const taskInfoRef = db.collection('taskInfo').doc(taskInfoId);
    const taskInfoSnap = await taskInfoRef.get();

    if (!taskInfoSnap.exists) {
      return res.status(404).json({ message: 'Tarea general no encontrada.' });
    }

    const taskInfo = taskInfoSnap.data();

    /* if (taskInfo.empresaId !== empresaId) {
      return res.status(403).json({ message: 'No autorizado sobre esta tarea.' });
    } */

    // 4. Generar código de 6 dígitos
    const code = generate6DigitCode();
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + minutosValidez * 60000)
    );

    // 5. Guardar en taskInfo el código de relevo
    await taskInfoRef.update({
      codigoRelevo: code,
      relevoExpira: expiresAt,
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
    const { uid: usuarioEntrante } = req.user;
    const { taskInfoId } = req.params;
    const { codigoRelevo } = req.body;

    if (!codigoRelevo || !taskInfoId) {
      return res.status(400).json({ error: "Código de relevo y taskInfoId son requeridos." });
    }

    // 1. Obtener el documento en taskInfo
    const taskInfoRef = db.collection("taskInfo").doc(taskInfoId);
    const taskInfoSnap = await taskInfoRef.get();

    if (!taskInfoSnap.exists) {
      return res.status(404).json({ error: "Tarea general no encontrada." });
    }

    const taskInfo = taskInfoSnap.data();

    // 2. Validar código
    if (
      taskInfo.codigoRelevo !== codigoRelevo ||
      taskInfo.validadoRelevo === true
    ) {
      return res.status(400).json({ error: "Código de relevo inválido o ya utilizado." });
    }

    const now = new Date();
    const expira = taskInfo.relevoExpira?.toDate?.() ?? null;
    if (!expira || now > expira) {
      return res.status(400).json({ error: "El código de relevo ha expirado." });
    }

    // 3. Buscar asignaciones de la tarea
    const snapshot = await db.collection("taskAssignments")
      .where("taskInfoId", "==", taskInfoId)
      .where("requiereRelevo", "==", true)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No se encontraron asignaciones con relevo para esa tarea." });
    }

    let entranteRef = null;
    let salienteRef = null;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const ref = doc.ref;

      if (data.assignedTo === usuarioEntrante) {
        entranteRef = ref;
      } else if (data.status !== "finalizada") {
        salienteRef = ref;
      }
    }

    if (!entranteRef || !salienteRef) {
      return res.status(400).json({ error: "No se pudo identificar al usuario entrante o saliente." });
    }

    // 4. Ejecutar transacción para actualizar ambos documentos
    await db.runTransaction(async (transaction) => {
      transaction.update(taskInfoRef, {
        validadoRelevo: true
      });

      transaction.update(entranteRef, {
        status: "en curso"
      });

      transaction.update(salienteRef, {
        status: "finalizada"
      });
    });

    return res.status(200).json({ message: "Relevo realizado con éxito." });

  } catch (error) {
    console.error("Error al realizar relevo:", error);
    return res.status(500).json({ error: "Error interno al realizar el relevo." });
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
    const { uid: assignedBy, empresaId } = req.user;
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
      shouldBeWorking: [],
      currentlyWorking: [],
      assignedBy,
      empresaId,
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
      const overlappingTasks = await db.collection("taskAssignments")
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
    // Crear tareas individuales en la colección taskAssignments
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
    await updateDynamicTaskInfoStatus(taskInfoRef.id); // Actualizar el estado de la tarea general después de crear las asignaciones

    // Respuesta exitosa
    res.status(201).json({ message: "Tarea registrada en taskInfo y tareas individuales creadas en taskAssignments", taskInfoId: taskInfoRef.id, ...taskInfoData, assignments });
  } catch (error) {
    // Manejo de errores generales
    console.error("Error al asignar tarea:", error);
    res.status(500).json({ error: "Error interno al asignar la tarea" });
  }
};




// Nueva función para obtener todas las tareas detalladas para el administrador
exports.getAdminDetailedTasks = async (req, res) => {
    try {
        const { empresaId: adminEmpresaId, isAdmin } = req.user;

        if (!isAdmin) {
            return res.status(403).json({ message: "No autorizado: Solo los administradores pueden acceder a esta ruta." });
        }
        if (!adminEmpresaId) {
            return res.status(403).json({ message: "No autorizado: El administrador no está asociado a una empresa." });
        }

        // Obtener todas las taskInfo para la empresa del administrador
        const taskInfoSnapshot = await db.collection("taskInfo")
            .where("empresaId", "==", adminEmpresaId)
            .get();

        const detailedTasks = [];
        const taskNamesCache = {}

        for (const taskDoc of taskInfoSnapshot.docs) {
            const taskInfo = { id: taskDoc.id, ...taskDoc.data() };

            // Convertir Timestamps a ISO 8601 strings
            for (const key of ['startTime', 'endTime', 'createdAt', 'relevoExpira']) {
                if (taskInfo[key] instanceof Timestamp) {
                    taskInfo[key] = taskInfo[key].toDate().toISOString();
                } else if (taskInfo[key] instanceof Date) { // Si ya es Date, convertir a ISO string
                    taskInfo[key] = taskInfo[key].toISOString();
                }
            }

            if (taskInfo.taskId) { // Asegúrate de que hay un taskId
                if (!taskNamesCache[taskInfo.taskId]) {
                    // Asumiendo que las definiciones de las tareas están en una colección 'tasks'
                    const taskDefDoc = await db.collection('tasks').doc(taskInfo.taskId).get();
                    if (taskDefDoc.exists) {
                        taskNamesCache[taskInfo.taskId] = taskDefDoc.data().title || 'Nombre no disponible'; // Asumiendo que el campo se llama 'title'
                    } else {
                        taskNamesCache[taskInfo.taskId] = 'Nombre de tarea no encontrado';
                    }
                }
                taskInfo.taskName = taskNamesCache[taskInfo.taskId];
            } else {
                taskInfo.taskName = 'ID de tarea general no especificado';
            }

            // Obtener todas las asignaciones para esta tareaInfo
            const assignmentsSnapshot = await db.collection("taskAssignments")
                .where("taskInfoId", "==", taskInfo.id)
                .get();

            const assignments = [];
            for (const assignmentDoc of assignmentsSnapshot.docs) {
                const assignmentData = { id: assignmentDoc.id, ...assignmentDoc.data() };

                // Convertir Timestamps a ISO 8601 strings para la asignación
                for (const key of ['startTimeIndividualTask', 'endTimeIndividualTask', 'createdAt', 'realStartTime', 'realEndTime']) {
                    if (assignmentData[key] instanceof Timestamp) {
                        assignmentData[key] = assignmentData[key].toDate().toISOString();
                    } else if (assignmentData[key] instanceof Date) {
                        assignmentData[key] = assignmentData[key].toISOString();
                    }
                }

                // Desencriptar datos del usuario asignado
                if (assignmentData.assignedTo) {
                    assignmentData.assignedToUser = await getUserDataAndDecrypt(assignmentData.assignedTo);
                }

                assignments.push(assignmentData);
            }

            taskInfo.assignments = assignments;
            // shouldBeWorking y currentlyWorking ya vienen de la DB, no se recalculan aquí.
            taskInfo.shouldBeWorking = taskInfo.shouldBeWorking || [];
            taskInfo.currentlyWorking = taskInfo.currentlyWorking || [];


            detailedTasks.push(taskInfo);
        }

        res.status(200).json(detailedTasks);

    } catch (error) {
        console.error("Error al obtener tareas detalladas para administrador:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener tareas detalladas." });
    }
};

exports.patchAssignmentStatus = async (req, res) => {
  const { assignmentId } = req.params;
  const { status } = req.body;
  const { uid: userId } = req.user;

  const ref = db.collection('taskAssignments').doc(assignmentId);
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: 'Asignación no encontrada.' });

  const data = snap.data();
  if (data.assignedTo !== userId) {
    return res.status(403).json({ error: 'No autorizado.' });
  }

  await ref.update({ status });
  return res.json({ message: 'Estado actualizado.' });
};
