const { Router } = require('express');
const { db } = require('../firebase');
const { createTask } = require('../controllers/taskController');
const { checkAdminPrivileges } = require('../middlewares/authorization');
const { verifyAndDecodeToken } = require('../middlewares/authentication');
const { getDateRange } = require('../utils/dateFilters');
const { taskStatus } = require('../controllers/taskController'); // OK

const router = Router();

router.post('/createTask', verifyAndDecodeToken, checkAdminPrivileges, createTask); // OK

// Reasignar tarea a usuario usando uid en lugar de rut
// AÑADIDO: verifyAndDecodeToken y checkAdminPrivileges para seguridad
router.put('/reassign-task/:taskId', verifyAndDecodeToken, checkAdminPrivileges, async (req, res) => {
  const { taskId } = req.params;
  const { newAssignedToUid } = req.body; // adminUid ya no viene del body

  if (!newAssignedToUid) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: newAssignedToUid' });
  }

  try {
    // La verificación de admin ya la hace 'checkAdminPrivileges', así que estas líneas son redundantes.
    // const adminUid = req.user.uid; // Si necesitas el UID del admin, tómalo de req.user.uid
    /*
    const adminDoc = await db.collection('users').doc(adminUid).get();
    if (!adminDoc.exists || !adminDoc.data().isAdmin) {
      return res.status(403).json({ error: 'Solo administradores pueden reasignar tareas' });
    }
    */

    // Verifica que el nuevo usuario existe
    const userDoc = await db.collection('users').doc(newAssignedToUid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Nuevo usuario no encontrado' });
    }

    // Actualiza la tarea con el nuevo assignedTo (usando uid)
    await db.collection('tasks').doc(taskId).update({
      assignedTo: newAssignedToUid
    });

    res.status(200).json({ message: 'Tarea reasignada con éxito' });

  } catch (error) {
    console.error('Error al reasignar tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// Nueva ruta: Obtener todas las tareas ASIGNADAS AL USUARIO AUTENTICADO
router.get('/my-tasks', verifyAndDecodeToken, async (req, res) => {
  const userId = req.user.uid; // Obtenemos el UID del token

  try {
    const snapshot = await db.collection('tasks').where('assignedTo', '==', userId).get();
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas del usuario autenticado:', error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

// Ruta para ver TODAS las tasks (solo para administradores)
router.get('/tasks', verifyAndDecodeToken, checkAdminPrivileges, async (req, res) => { // AÑADIDO: verifyAndDecodeToken y checkAdminPrivileges
    try {
      const snapshot = await db.collection('tasks').get();
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      res.status(200).json(tasks);
    } catch (error) {
      console.error('Error al obtener todas las tareas:', error);
      res.status(500).json({ error: 'Error al obtener tareas' });
    }
  });

// Ruta para visualizar tareas pendientes del USUARIO AUTENTICADO
router.get('/my-pending-tasks', verifyAndDecodeToken, async (req, res) => {
  const userId = req.user.uid; // Obtenemos el UID del token
  try {
    const snapshot = await db.collection('tasks')
      .where('status', '==', 'pendiente')
      .where('assignedTo', '==', userId)
      .get();
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Error fetching pending tasks for authenticated user:', error);
    res.status(500).json({ error: 'Failed to fetch pending tasks' });
  }
});

  // Obtener todas las tareas de un usuario específico (para administradores)
// CAMBIADO: :userId a :uid. AÑADIDO: verifyAndDecodeToken y checkAdminPrivileges
router.get('/tasks/:uid', verifyAndDecodeToken, checkAdminPrivileges, async (req, res) => {
  const { uid } = req.params; // CORREGIDO: De userId a uid
  try {
    const snapshot = await db.collection('tasks').where('assignedTo', '==', uid).get(); // CORREGIDO: De userId a uid
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ error: 'Error al obtener tareas' });
  }
});

// Actualizar el estado de una tarea (YA ESTABA BIEN, solo mantengo el código)
router.patch('/tasks/:taskId/status', verifyAndDecodeToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.uid;

    const validStatuses = ['pendiente', 'en progreso', 'completada'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido.' });
    }

    const taskRef = db.collection('tasks').doc(taskId);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Tarea no encontrada.' });
    }

    const taskData = taskDoc.data();

    // Ensure the task belongs to the user
    if (taskData.assignedTo !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta tarea.' });
    }

    // Update the status
    await taskRef.update({ status });

    res.json({ message: 'Estado de la tarea actualizado exitosamente.' });
  } catch (error) {
    console.error('Error al actualizar el estado de la tarea:', error);
    res.status(500).json({ error: 'Error al actualizar el estado.' });
  }
});


// Obtener estado de las tareas del usuario (propio o de otro por admin)
// CAMBIADO: :userId a :uid.
router.get('/statustasks/:uid', verifyAndDecodeToken, async (req, res) => {
  try {
    // console.log("a") // ELIMINAR LOGS
    const { uid } = req.params; // CORREGIDO: De userId a uid
    // console.log(uid) // ELIMINAR LOGS
    // console.log("aa") // ELIMINAR LOGS
    const requestingUserUid = req.user.uid; // CAMBIADO: requestingUserId a requestingUserUid para consistencia
    // console.log(requestingUserUid) // ELIMINAR LOGS

    // 1. Verificar permisos (solo el propio usuario o admin puede ver sus tareas)
    const userDoc = await db.collection('users').doc(requestingUserUid).get();
    const userData = userDoc.data();
    // console.log("aaa") // ELIMINAR LOGS
    if (uid !== requestingUserUid && !userData.isAdmin) { // CORREGIDO: userId a uid
      return res.status(403).json({ error: 'No autorizado para ver estas tareas' });
    }

    // 2. Verificar que el usuario solicitado existe
    const requestedUserDoc = await db.collection('users').doc(uid).get(); // CORREGIDO: userId a uid
    if (!requestedUserDoc.exists) {
      return res.status(404).json({ error: 'Usuario solicitado no encontrado' });
    }

    // 3. Construir consulta base
    let tasksQuery = db.collection('tasks').where('assignedTo', '==', uid); // CORREGIDO: userId a uid

    // 4. Aplicar filtros opcionales
    const { status, priority } = req.query;
    
    if (status) {
      tasksQuery = tasksQuery.where('status', '==', status);
    }
    
    if (priority) {
      tasksQuery = tasksQuery.where('priority', '==', priority);
    }

    const { today, week } = req.query;
    if (today === 'true') {
      const { startDate, endDate } = getDateRange('today');
      tasksQuery = tasksQuery.where('startTime', '>=', startDate).where('startTime', '<=', endDate); 
    }

    if (week === 'true') {
      const { startDate, endDate } = getDateRange('week');
      tasksQuery = tasksQuery.where('startTime', '>=', startDate).where('startTime', '<', endDate);
    }

    // 5. Ordenar por fecha de creación (nuevas primero)
    tasksQuery = tasksQuery.orderBy('createdAt', 'desc');

    // 6. Ejecutar consulta
    const snapshot = await tasksQuery.get();

    // 7. Formatear respuesta
    const tasks = snapshot.docs.map(doc => {
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

    // 8. Enviar respuesta
    res.status(200).json({
      user: {
        id: uid, // CORREGIDO: userId a uid
        name: requestedUserDoc.data().name,
        lastName: requestedUserDoc.data().lastName
      },
      count: tasks.length,
      tasks
    });

  } catch (error) {
    console.error('Error al obtener tareas:', error);
    
    if (error.code === 3) {
      return res.status(400).json({ error: 'Parámetros de consulta inválidos' });
    }
    
    res.status(500).json({ 
      error: 'Error al obtener tareas',
      details: error.message 
    });
  }
});


module.exports = router;