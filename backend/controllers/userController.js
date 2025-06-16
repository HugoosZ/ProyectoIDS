const authService = require('../services/authService');
const { validarDigitoVerificador } = require('../utils/validadorRUT');
const { v4: uuidv4 } = require('uuid');
const { encrypt, decrypt } = require('../utils/crypto'); // <-- Importa el utilitario de cifrado y desencriptado
const { db } = require('../firebase');

exports.createUser = async (req, res) => {
  // console.log("DEBUG: Contenido de req.body al inicio de createUser:", req.body);
  try {
    const { email, password, rut, name, lastName, role, isAdmin } = req.body;

    let finalEmpresaId;

    if (req.user && req.user.isAdmin && req.user.empresaId) {
      finalEmpresaId = req.user.empresaId; // Hereda el empresaId del admin que crea el usuario
      console.log(
        "DEBUG: Heredando empresaId del admin autenticado:",
        finalEmpresaId
      );
    } else if (isAdmin) {
      
      finalEmpresaId = uuidv4(); // Genera un nuevo empresaId para este nuevo admin
      console.log(
        "DEBUG: Generando nuevo empresaId para el primer admin:",
        finalEmpresaId
      );
    } else {
      console.warn(
        "ADVERTENCIA: Creando usuario sin empresaId heredado ni especificado. Generando uno nuevo."
      );
      finalEmpresaId = uuidv4(); // O podrías lanzar un error si prefieres que siempre se herede o se especifique
    }

    // Validar campos obligatorios
    if (!email || !password || !rut || !name || !lastName || !role) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Correo electrónico inválido" });
    }

    // Validar formato del RUT (ej: 12345678-9)
    if (!/^[\d]{7,8}-[\dkK]$/.test(rut)) {
      return res.status(400).json({ error: "RUT inválido" });
    }
    if (!validarDigitoVerificador(rut)) {
      return res
        .status(400)
        .json({ error: "RUT inválido: dígito verificador incorrecto" });
    }

    // Validar si el RUT ya existe (comparando desencriptado)
    const usersSnapshot = await authService.getAllUsersRaw(); // Debes implementar este método para obtener todos los usuarios sin desencriptar
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      let decryptedRut = null;
      try { decryptedRut = decrypt(userData.rut); } catch (e) {
        console.warn("Error al desencriptar RUT:", e);
      }
      if (decryptedRut === rut) {
        return res.status(409).json({ error: "El RUT ya está registrado." });
      }
    }

    // Cifrar datos sensibles antes de crear el usuario
    const encryptedRut = encrypt(rut);
    const encryptedName = encrypt(name);
    const encryptedLastName = encrypt(lastName);

    const newUser = await authService.createUserWithRole({
      email,
      password,
      rut: encryptedRut, // Guardar cifrado
      name: encryptedName, // Guardar cifrado
      lastName: encryptedLastName, // Guardar cifrado
      role,
      isAdmin,
      empresaId: finalEmpresaId,
    });

    res.status(201).json(newUser);
    
  } catch (error) {
    console.error("Error en userController.createUser:", error); // Cambiado para claridad
    if (error.message.includes("email ya está registrado")) {
      return res.status(409).json({ error: error.message });
    } else if (
      error.message.includes("contraseña debe tener al menos 6 caracteres")
    ) {
      return res.status(400).json({ error: error.message });
    } else {
      res
        .status(500)
        .json({ error: "Error interno del servidor al crear usuario." });
    }
  }
};

exports.getUsersByEmpresa = async (req, res) => {
    try {
        // Obtenemos el empresaId del administrador logueado (inyectado por verifyAndDecodeToken)
        const adminEmpresaId = req.user.empresaId;

        if (!adminEmpresaId) {
            // Si el admin no tiene un empresaId, no puede acceder a los usuarios
            return res.status(403).json({ message: "Forbidden: Admin user is not associated with an enterprise." });
        }

        // Consulta a Firestore para obtener solo los usuarios de la misma empresa
        const snapshot = await db.collection('users')
                                .where('empresaId', '==', adminEmpresaId)
                                .get();

        if (snapshot.empty) {
            return res.status(200).json([]); // Devuelve un array vacío si no hay usuarios en esa empresa
        }

        const users = snapshot.docs.map(doc => {
            const userData = doc.data();
            let name = userData.name;
            let lastName = userData.lastName;
            let rut = userData.rut;
            try { name = decrypt(name); } catch (e) {}
            try { lastName = decrypt(lastName); } catch (e) {}
            try { rut = decrypt(rut); } catch (e) {}
            // Opcional: Eliminar campos sensibles antes de enviar la respuesta
            delete userData.password; // Si almacenas contraseñas, elimínala
            // delete userData.someOtherSensitiveField;
            return {
                id: doc.id,
                ...userData,
                name,
                lastName,
                rut
            };
        });

        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener usuarios', details: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        if (snapshot.empty) {
            return res.status(200).json([]);
        }
        const users = snapshot.docs.map(doc => {
            const userData = doc.data();
            let name = userData.name;
            let lastName = userData.lastName;
            let rut = userData.rut;
            try { name = decrypt(name); } catch (e) {}
            try { lastName = decrypt(lastName); } catch (e) {}
            try { rut = decrypt(rut); } catch (e) {}
            delete userData.password;
            return {
                id: doc.id,
                ...userData,
                name,
                lastName,
                rut
            };
        });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener todos los usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener usuarios', details: error.message });
    }
};

