const { auth } = require('../firebase');
const { validarDigitoVerificador } = require('../utils/validadorRUT');

const login = async (req, res) => {
    try {
        const { rut, password } = req.body;

        if (!rut || !password) {
            return res.status(400).json({
                success: false,
                message: 'RUT y contraseña son requeridos'
            });
        }

        // Validación del RUT usando la función existente
        try {
            if (!validarDigitoVerificador(rut)) {
                return res.status(400).json({
                    success: false,
                    message: 'RUT inválido'
                });
            }
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Formato de RUT inválido. Debe ser como: 12345678-9'
            });
        }

        try {
            // Aquí iría la lógica para autenticar con Firebase usando el RUT
            // Por ahora retornamos una respuesta de éxito simulada
            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: {
                    rut: rut,
                    // Otros datos del usuario que quieras retornar
                }
            });
        } catch (authError) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

module.exports = {
    login
}; 