const authService = require('../services/authService');
const { validarDigitoVerificador } = require('../utils/validadorRUT');


exports.createUser = async (req, res) => {
    try {
        const { email, password, rut, name, lastName, role, isAdmin } = req.body;
    
        // Validar campos obligatorios
        if (!email || !password || !rut || !name || !lastName || !role) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }
    
        // Validar formato del RUT (ej: 12345678-9)
        if (!/^\d{7,8}-[\dkK]$/.test(rut)) {
            return res.status(400).json({ error: 'RUT inválido' });
        }
        if (!validarDigitoVerificador(rut)) {
            return res.status(400).json({ error: 'RUT inválido: dígito verificador incorrecto' });
        }
    
        const newUser = await authService.createUserWithRole({
            email, password, rut, name, lastName, role, isAdmin
        });
    
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  };

  