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
            // Por ahora generamos un token simulado
            const token = 'token_simulado_' + Date.now(); // En producción, esto debería ser un JWT real
            
            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                token: token,
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

const cambiarPassword = async (req, res) => {
    try {
        const { rut, nuevaPassword, confirmarPassword } = req.body;

        // Validaciones básicas
        if (!rut || !nuevaPassword || !confirmarPassword) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Validar que las nuevas contraseñas coincidan
        if (nuevaPassword !== confirmarPassword) {
            return res.status(400).json({
                success: false,
                message: 'Las nuevas contraseñas no coinciden'
            });
        }

        // Validar el formato del RUT
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
                message: 'Formato de RUT inválido'
            });
        }

        // Validar longitud mínima de la nueva contraseña
        if (nuevaPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        try {
            // Aquí iría la lógica para actualizar la contraseña en Firebase
            // Usando el RUT como identificador
            await auth.updateUser(rut, {
                password: nuevaPassword
            });

            res.status(200).json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
        } catch (authError) {
            return res.status(401).json({
                success: false,
                message: 'Error al actualizar la contraseña. Usuario no encontrado.'
            });
        }

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar la contraseña',
            error: error.message
        });
    }
};

module.exports = {
    login,
    cambiarPassword
}; 