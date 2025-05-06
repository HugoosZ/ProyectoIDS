const express = require('express');
const router = express.Router();

const { verifyAndDecodeToken } = require('../middlewares/authentication'); //  Middleware de autenticación
const userController = require('../controllers/userController');
const { checkAdminPrivileges } = require('../middlewares/authorization'); // Middleware de autorización
// Se usa llaves en la asignacion de nombres para poder renombrarlos, si no, hay que ponerle el nombre del codigo y como son parecidos es mejor renombrar

//router.post('/users', verifyAndDecodeToken, checkAdminPrivileges, userController.createUser);
router.post('/users', userController.createUser);
router.get('/', async (req, res) => {
    res.send("¡Ruta /api/admin funciona correctamente!");
});

module.exports = router; 