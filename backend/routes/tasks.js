const { Router } = require('express');
const { db } = require('../firebase');
const { createTask } = require('../controllers/taskController');


const router = Router();

router.post('/createTask', createTask); // Crear tarea usando el controlador en controllers/taskController.js


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

  module.exports = router;
