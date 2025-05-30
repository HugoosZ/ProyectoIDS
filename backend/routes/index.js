//archivos donde se deben crear todas las rutas de acceso a la db

const express = require('express');
const router = express.Router();  // Usa el Router de express directamente

const {db} = require('../firebase'); // para traer el objeto db que se exporta de firebase.js


router.get('/', async (req, res) => {
    const querySnapshot = await db.collection('users').get()    //consulta de prueba a db

    console.log(querySnapshot.docs[0].data()); //para ver los datos que se recuperan
    res.send("Prueba de que funciona:)");
})

router.get('/users', async (req, res) => {
    try {
        // 1. Obtener todos los documentos de la colección "users"
        const querySnapshot = await db.collection('users').get();

        // 2. Mapear los datos de cada documento a un array de objetos
        const users = querySnapshot.docs.map((doc) => ({
            rut: doc.id,  
            isAdmin: doc.data().isAdmin,
            name: doc.data().name,
            lastName: doc.data().lastName,
            email: doc.data().email,
            role: doc.data().role
            
        }));

        // 3. Enviar la respuesta como JSON
        res.status(200).json(users);

    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: "Error al cargar los usuarios" });
    }
})

router.get('/collections', async (req, res) => { //Para ver las tablas!
    try {
        const collections = await db.listCollections();
        const collectionNames = collections.map(col => col.id);
        
        res.json({
            collections: collectionNames,
            count: collectionNames.length
        });
    } catch (error) {
        res.status(500).json({ error: "Error al listar colecciones" });
    }
});

router.get('/structure', async (req, res) => { //Para ver estructura, en este caso de "users"
    try {
        const snapshot = await db.collection('users').limit(1).get();
        
        if (snapshot.empty) {
            return res.status(404).json({ message: "No hay usuarios registrados" });
        }

        const sampleUser = snapshot.docs[0].data();
        const attributes = Object.keys(sampleUser);

        res.json({
            collection: "users",
            attributes: attributes,
            sampleData: sampleUser // Opcional: mostrar un ejemplo
        });
    } catch (error) {
        res.status(500).json({ error: "Error al leer estructura", details: error.message });
    }
});


module.exports = router;