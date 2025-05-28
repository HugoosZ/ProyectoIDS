const { db } = require("../firebase");

exports.checkAdminPrivileges = async (req, res, next) => {
  try {
    const uid = req.user.uid; // RUT

    const userDoc = await db.collection("users").doc(uid).get(); // Paso 2: Consulta SOLO el documento de ese RUT
    if (!userDoc.exists || !userDoc.data().isAdmin) {
      return res.status(403).json({ error: "Se requiere rol admin" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Error al validar permisos" });
  }
};

exports.checkEmpresaId = async (req, res, next) => {
    try {
        // El UID solicitado en la URL puede venir de :uid o :userId
        const requestedUserId = req.params.uid || req.params.userId;
        // Datos del usuario autenticado, provienen de verifyAndDecodeToken (req.user)
        const authenticatedUserId = req.user.uid;
        const authenticatedUserEmpresaId = req.user.empresaId;
        const isAuthenticatedUserAdmin = req.user.isAdmin;

        // Caso 1: El usuario autenticado es un administrador
        if (isAuthenticatedUserAdmin) {
            // Si el admin está pidiendo sus propios datos, se permite
            if (requestedUserId === authenticatedUserId) {
                return next();
            }

            // Si el admin está pidiendo datos de otro usuario,
            // verificamos si ese usuario pertenece a la misma empresa.
            const targetUserDoc = await db.collection('users').doc(requestedUserId).get();

            if (!targetUserDoc.exists) {
                return res.status(404).json({ message: "Usuario solicitado no encontrado." });
            }

            const targetUserEmpresaId = targetUserDoc.data().empresaId;

            if (targetUserEmpresaId !== authenticatedUserEmpresaId) {
                return res.status(403).json({ message: "No autorizado: El administrador no puede ver datos de usuarios de otra empresa." });
            }

            // Si el admin y el usuario solicitado están en la misma empresa, se permite.
            return next();

        } else {
            // Caso 2: El usuario autenticado NO es un administrador
            // Solo puede acceder a sus propios datos.
            // Si el UID solicitado en la URL es diferente al UID del usuario autenticado
            if (requestedUserId && requestedUserId !== authenticatedUserId) {
                return res.status(403).json({ message: "No autorizado: Solo puedes ver tus propias tareas." });
            }
            next(); // Si el UID solicitado es el propio, o no se especificó (aunque para :uid siempre se especifica), pasa.
        }
    } catch (error) {
        console.error("Error en checkEmpresaId:", error); // Añadimos un console.error para depuración
        res.status(500).json({ message: "Error interno del servidor al verificar la autorización." });
    }
};