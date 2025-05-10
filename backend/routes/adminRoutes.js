const express = require('express');
const router = express.Router();

const { verifyAndDecodeToken } = require('../middlewares/authentication'); //  Middleware de autenticación
const userController = require('../controllers/userController');
const { checkAdminPrivileges } = require('../middlewares/authorization'); // Middleware de autorización
// Se usa llaves en la asignacion de nombres para poder renombrarlos, si no, hay que ponerle el nombre del codigo y como son parecidos es mejor renombrar



router.get('/checkAdmin', verifyAndDecodeToken, checkAdminPrivileges, async (req, res) => {
    // Como ya se pasaron las auntenticaciones se puede postear el json
    res.json({ isAdmin: true }); 
    
});

router.post('/createUser', verifyAndDecodeToken, checkAdminPrivileges, userController.createUser); 


router.get('/', async (req, res) => {
    res.send("¡Ruta /api/admin funciona correctamente!");
});

module.exports = router; 