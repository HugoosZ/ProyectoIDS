//archivos donde se deben crear todas las rutas de acceso a la db
const {Router} = require('express');
const {db} = require('../firebase'); // para traer el objeto db que se exporta de firebase.js

const router = Router();

router.get('/', async (req, res) => {
    const querySnapshot = await db.collection('users').get();    //consulta de prueba a db

    console.log(querySnapshot.docs[0].data()); //para ver los datos que se recuperan
    res.send("Prueba de que funciona");
})

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


//ruta login

router.post('/login', async (req, res) => {
    const { rut, idToken } = req.body;
  
    if (!rut || !idToken) {
      return res.status(400).json({ error: 'Faltan campos' });
    }
  
    try {
      // Buscar el email asociado al RUT
      const snapshot = await db.collection('users').where('rut', '==', rut).get();
  
      if (snapshot.empty) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
  
      const userData = snapshot.docs[0].data();
      const email = userData.email;
  
      // Verificar el token recibido desde frontend
      const decodedToken = await auth.verifyIdToken(idToken);
  
      // Confirmar que el email del token sea el esperado
      if (decodedToken.email !== email) {
        return res.status(401).json({ error: 'Token inválido para este RUT' });
      }
  
      res.status(200).json({ message: 'Login exitoso', user: userData });
  
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
module.exports = router;