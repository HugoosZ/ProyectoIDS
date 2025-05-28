const authService = require('../services/authService');
const { validarDigitoVerificador } = require('../utils/validadorRUT');
const { v4: uuidv4 } = require('uuid');

exports.createUser = async (req, res) => {
  // console.log("DEBUG: Contenido de req.body al inicio de createUser:", req.body);
  try {
    const { email, password, rut, name, lastName, role, isAdmin } = req.body;

    let finalEmpresaId;

    // Si la petición viene de un usuario autenticado (req.user existe)
    // Y ese usuario es un admin (req.user.isAdmin es true)
    // Y ese admin ya tiene un empresaId asignado
    if (req.user && req.user.isAdmin && req.user.empresaId) {
      finalEmpresaId = req.user.empresaId; // Hereda el empresaId del admin que crea el usuario
      console.log(
        "DEBUG: Heredando empresaId del admin autenticado:",
        finalEmpresaId
      );
    } else if (isAdmin) {
      // Si el usuario que se está CREANDO es un admin, y no se hereda un ID (porque no hay admin padre o no tiene ID)
      // Esto es para el SCENARIO A: crear el PRIMER admin de una nueva empresa.
      finalEmpresaId = uuidv4(); // Genera un nuevo empresaId para este nuevo admin
      console.log(
        "DEBUG: Generando nuevo empresaId para el primer admin:",
        finalEmpresaId
      );
    } else {
      // Si el usuario que se está creando NO es un admin, y NO hay un admin padre para heredar el ID,
      // esto indica un flujo no esperado para un usuario regular sin empresaId, o un error.
      // Para mantener la consistencia, podríamos forzar un error o requerir el empresaId.
      // Por simplicidad, si no es un admin y no viene de un admin padre, podríamos lanzas un error
      // o generar uno nuevo si es un flujo de registro diferente.
      // Por ahora, asumimos que todos los usuarios deben tener un empresaId.
      // Si llega aquí, significa que un usuario regular (no admin) está siendo creado sin un admin padre que le asigne empresaId
      // ni se especificó uno en el body. Esto podría ser un error o un escenario de registro específico.
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
    if (!/^\d{7,8}-[\dkK]$/.test(rut)) {
      return res.status(400).json({ error: "RUT inválido" });
    }
    if (!validarDigitoVerificador(rut)) {
      return res
        .status(400)
        .json({ error: "RUT inválido: dígito verificador incorrecto" });
    }

    const newUser = await authService.createUserWithRole({
      email,
      password,
      rut,
      name,
      lastName,
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

  