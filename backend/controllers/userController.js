const authService = require('../services/authService');
const { validarDigitoVerificador } = require('../utils/validadorRUT');
const { v4: uuidv4 } = require('uuid');
const { encrypt, decrypt, hashRut } = require('../utils/crypto'); // <-- Importa el utilitario de cifrado y desencriptado
const { db } = require('../firebase');
const { sendTempPassword, generateTempPassword } = require('../services/emailService');

exports.createUser = async (req, res) => {
  // console.log("DEBUG: Contenido de req.body al inicio de createUser:", req.body);
  try {
    const { email, rut, name, lastName, role, isAdmin } = req.body;

    const rutHash = hashRut(rut);
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
    if (!email || !rut || !name || !lastName || !role) {
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
    const existing = await db.collection('users').where('rutHash', '==', rutHash).get();
    if (!existing.empty) {
      return res.status(409).json({ error: "El RUT ya está registrado." });
    }
    // Generar contraseña temporal
    const tempPassword = generateTempPassword(10);
    // Cifrar datos sensibles antes de crear el usuario
    const encryptedRut = encrypt(rut);
    const encryptedName = encrypt(name);
    const encryptedLastName = encrypt(lastName);
    // Crear usuario en Auth y Firestore
    const newUser = await authService.createUserWithRole({
      email,
      password: tempPassword,
      rut: encryptedRut,
      rutHash,
      name: encryptedName, // Guardar cifrado
      lastName: encryptedLastName, // Guardar cifrado
      role,
      isAdmin,
      empresaId: finalEmpresaId,
    });
    // Enviar contraseña temporal al correo
    await sendTempPassword(email, tempPassword);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error en userController.createUser:", error);
    if (error.message.includes("email ya está registrado")) {
      return res.status(409).json({ error: error.message });
    } else if (
      error.message.includes("contraseña debe tener al menos 6 caracteres")
    ) {
      return res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error interno del servidor al crear usuario." });
    }
  }
};

exports.getUsersByEmpresa = async (req, res) => {
    try {
        const { isAdmin, empresaId } = req.user; // Esto viene del middleware verifyAndDecodeToken

        if (!empresaId) {
            return res.status(400).json({ message: "ID de empresa no proporcionado en el token." });
        }

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('empresaId', '==', empresaId).get();

        if (snapshot.empty) {
            return res.status(404).json({ message: "No se encontraron usuarios para esta empresa." });
        }

        const users = snapshot.docs.map(doc => {
            const userData = doc.data();
            // Desencriptar datos sensibles si están encriptados
            const decryptedName = userData.name ? decrypt(userData.name) : null;
            const decryptedLastName = userData.lastName ? decrypt(userData.lastName) : null;
            const decryptedRut = userData.rut ? decrypt(userData.rut) : null;

            return {
                uid: doc.id, // El UID es el ID del documento en Firestore
                email: userData.email,
                role: userData.role,
                isAdmin: userData.isAdmin,
                empresaId: userData.empresaId,
                createdAt: userData.createdAt ? userData.createdAt.toDate().toISOString() : null,
                name: decryptedName,
                lastName: decryptedLastName,
                rut: decryptedRut,
                // Asegúrate de incluir otros campos que necesites
            };
        });

        res.status(200).json(users);

    } catch (error) {
        console.error("Error al obtener usuarios por empresa:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener usuarios." });
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
                id: doc.id, // Firestore document ID
                uid: doc.id, // UID sin desencriptar
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

