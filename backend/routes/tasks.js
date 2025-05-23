const { Router } = require('express');
const { db } = require('../firebase');
const { createTask } = require('../controllers/taskController');
const { checkAdminPrivileges } = require('../middlewares/authorization');
const { verifyAndDecodeToken } = require('../middlewares/authentication');
const { getDateRange } = require('../utils/dateFilters');
const { taskStatus } = require('../controllers/taskController');

const router = Router();

router.post('/createTask', verifyAndDecodeToken, checkAdminPrivileges, createTask); // Crear tarea usando el controlador en controllers/taskController.js


  // Reasignar tarea a usuario usando uid en lugar de rut
router.put('/reassign-task/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { newAssignedToUid, adminUid } = req.body;

  if (!newAssignedToUid || !adminUid) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Verifica que el admin existe y tiene permisos
    const adminDoc = await db.collection('users').doc(adminUid).get();
    if (!adminDoc.exists || !adminDoc.data().isAdmin) {
      return res.status(403).json({ error: 'Solo administradores pueden reasignar tareas' });
    }

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

//ruta para ver las tasks
  router.get('/tasks', async (req, res) => {
    try {
      const snapshot = await db.collection('tasks').get();
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

router.get('/pendingTasks/:userId', async (req, res) => { // Visualizar tareas pendientes de forma general
  const { userId } = req.params;
  try {
    const snapshot = await db.collection('tasks')
      .where('status', '==', 'pendiente' && 'assignedTo', '==', userId).get();
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    res.status(500).json({ error: 'Failed to fetch pending tasks' });
  }
});

  // Obtener todas las tareas de un usuario específico
router.get('/tasks/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const snapshot = await db.collection('tasks').where('assignedTo', '==', userId).get();
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

// Actualizar el estado de una tarea
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


 // Obtener estado de las tareas del usuario donde tanto como el admin y el usuario puede ver tareas asignadas a alguien
//router.get('/statustasks/:userId', verifyAndDecodeToken, taskStatus);
router.get('/statustasks/:userId', verifyAndDecodeToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId)
    const requestingUserId = req.user.uid; // ID del usuario que hace la petición (del token)
    console.log(requestingUserId)

    // 1. Verificar permisos (solo el propio usuario o admin puede ver sus tareas)
    const userDoc = await db.collection('users').doc(requestingUserId).get();
    const userData = userDoc.data();

    if (userId !== requestingUserId && !userData.isAdmin) {
      return res.status(403).json({ error: 'No autorizado para ver estas tareas' });
    }

    // 2. Verificar que el usuario solicitado existe
    const requestedUserDoc = await db.collection('users').doc(userId).get();
    if (!requestedUserDoc.exists) {
      return res.status(404).json({ error: 'Usuario solicitado no encontrado' });
    }

    // 3. Construir consulta base
    let tasksQuery = db.collection('tasks').where('assignedTo', '==', userId);

    // 4. Aplicar filtros opcionales
    const { status, priority } = req.query;
    
    if (status) {
      tasksQuery = tasksQuery.where('status', '==', status); // filtro de estado
    }
    
    if (priority) {
      tasksQuery = tasksQuery.where('priority', '==', priority); // filtro de prioridad
    }

    const { today, week } = req.query;
    if (today === 'true') { // filtro por dia
      const { startDate, endDate } = getDateRange('today');
      tasksQuery = tasksQuery.where('startTime', '>=', startDate).where('startTime', '<=', endDate); 
    }

    if (week === 'true') { // filtro por semana
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
        id: userId,
        name: requestedUserDoc.data().name,
        lastName: requestedUserDoc.data().lastName
      },
      count: tasks.length,
      tasks
    });

  } catch (error) {
    console.error('Error al obtener tareas:', error);
    
    if (error.code === 3) { // Código de error por consulta inválida
      return res.status(400).json({ error: 'Parámetros de consulta inválidos' });
    }
    
    res.status(500).json({ 
      error: 'Error al obtener tareas',
      details: error.message 
    });
  }
});


module.exports = router;
