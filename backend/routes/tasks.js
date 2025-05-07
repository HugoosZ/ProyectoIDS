const { Router } = require('express');
const { db } = require('../firebase');  // Suponiendo que tienes la configuración de Firebase

const router = Router();

//ruta para ver la info de los users
router.get('/users', async (req, res) => {
    try {
      const snapshot = await db.collection('users').get();
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      res.status(200).json(users);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

module.exports = router;  // Aquí está el cambio

