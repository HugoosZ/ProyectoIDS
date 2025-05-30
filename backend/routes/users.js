const { Router } = require('express');
const { db } = require('../firebase');
const { verifyAndDecodeToken } = require('../middlewares/authentication');

const router = Router();

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

router.get('/UserInfo', verifyAndDecodeToken, async (req, res) => {
  try {
      res.status(200).json({
        uid: req.user.uid,
        email: req.user.email,
      });
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    res.status(500).json({ error: 'Error al obtener información del usuario' });
  }
});


module.exports = router; 
