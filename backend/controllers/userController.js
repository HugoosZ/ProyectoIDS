const authService = require('../services/authService');
const { validarDigitoVerificador } = require('../utils/validadorRUT');
const { v4: uuidv4 } = require('uuid');
const { encrypt } = require('../utils/crypto'); // <-- Importa el utilitario de cifrado

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

    // Validar formato del RUT (ej: 12345678-9)
    if (!/^[\d]{7,8}-[\dkK]$/.test(rut)) {
      return res.status(400).json({ error: "RUT inválido" });
    }
    if (!validarDigitoVerificador(rut)) {
      return res
        .status(400)
        .json({ error: "RUT inválido: dígito verificador incorrecto" });
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

