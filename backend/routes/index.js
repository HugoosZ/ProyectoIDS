//archivos donde se deben crear todas las rutas de acceso a la db
const {Router} = require('express');
const {db} = require('../firebase'); // para traer el objeto db que se exporta de firebase.js

const router = Router();

router.get('/', async (req, res) => {
    const querySnapshot = await db.collection('users').get()    //consulta de prueba a db

    console.log(querySnapshot.docs[0].data()); //para ver los datos que se recuperan
    res.send("Prueba de que funciona");
})

module.exports = router;