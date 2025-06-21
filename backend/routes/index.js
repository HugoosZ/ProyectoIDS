//archivos donde se deben crear todas las rutas de acceso a la db

const express = require('express');
const router = express.Router();  // Usa el Router de express directamente

const {db} = require('../firebase'); // para traer el objeto db que se exporta de firebase.js
const { decrypt } = require('../utils/crypto'); // <-- Importa la función decrypt
const { sendTestEmail } = require('../services/emailService');


router.get('/', async (req, res) => {
    const querySnapshot = await db.collection('users').get()    //consulta de prueba a db

    console.log(querySnapshot.docs[0].data()); //para ver los datos que se recuperan
    res.send("Prueba de que funciona:)");
})



router.get("/collections", async (req, res) => {
  //Para ver las tablas!
  try {
    const collections = await db.listCollections();
    const collectionNames = collections.map((col) => col.id);

    res.json({
      collections: collectionNames,
      count: collectionNames.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al listar colecciones" });
  }
});

router.get("/structure", async (req, res) => {
  //Para ver estructura, en este caso de "users"
  try {
    const snapshot = await db.collection("users").limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No hay usuarios registrados" });
    }

    const sampleUser = snapshot.docs[0].data();
    const attributes = Object.keys(sampleUser);

    res.json({
      collection: "users",
      attributes: attributes,
      sampleData: sampleUser, // Opcional: mostrar un ejemplo
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al leer estructura", details: error.message });
  }
});

// Ruta temporal para desencriptar un string encriptado (solo admin)
router.post("/decrypt", async (req, res) => {
  const { encrypted } = req.body;
  if (!encrypted) {
    return res.status(400).json({ error: "Debes enviar el campo 'encrypted' en el body." });
  }
  try {
    const { decrypt } = require('../utils/crypto');
    const decrypted = decrypt(encrypted);
    res.status(200).json({ decrypted });
  } catch (error) {
    res.status(500).json({ error: "No se pudo desencriptar.", details: error.message });
  }
});

// Ruta para probar el envío de correo de prueba
router.get('/test-email', async (req, res) => {
  try {
    const result = await sendTestEmail();
    if (result.success) {
      res.status(200).json({ message: 'Correo de prueba enviado correctamente.' });
    } else {
      res.status(500).json({ error: 'No se pudo enviar el correo de prueba.', details: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error inesperado al enviar el correo de prueba.' });
  }
});

module.exports = router;