const admin = require('firebase-admin');

exports.verifyAndDecodeToken = async (req, res, next) => {
    try {
        // Paso 1: Extrae el token del header
        const token = req.headers.authorization?.split(' ')[1]; // de la estructura Bearer <token>, se toma token gracias a [1]
        // Bearer es un esquema de auntentificacion que indica portador de credenciales 

        console.log(token) //Borrar esto !!! Es solo para pruebas!!

        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        // Paso 2: Verifica el token con Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Paso 3: Añade el UID (RUT) al request
        req.user = decodedToken; // Aquí se guarda el token decodificado en el objeto request
        // Esto permite acceder a los datos del usuario autenticado en las siguientes rutas

        const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        req.user.empresaId = userDoc.data().empresaId;
        req.user.isAdmin = userDoc.data().isAdmin;
        
        console.log(decodedToken) //Borrar esto !!! Es solo para pruebas!!

        next(); // Pasa al siguiente middleware
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};