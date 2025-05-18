const { auth } = require('../firebase');
const { validarDigitoVerificador } = require('../utils/validadorRUT');

const login = async (req, res) => {
    try {
        console.log("a");
        const { rut, password } = req.body;

        if (!rut || !password) {
            return res.status(400).json({
                success: false,
                message: 'RUT y contraseña son requeridos'
            });
        }
        console.log("b");
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
        console.log("c");
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
        console.log("d");
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
    console.log("e");
};

const cambiarPassword = async (req, res) => {
    try {
        const { rut, passwordActual, nuevaPassword, confirmarPassword } = req.body;

        // Validaciones básicas
        if (!rut || !passwordActual || !nuevaPassword || !confirmarPassword) {
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
            // Aquí iría la lógica para verificar la contraseña actual y actualizar a la nueva
            // Por ahora retornamos una respuesta de éxito simulada
            res.status(200).json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
        } catch (authError) {
            return res.status(401).json({
                success: false,
                message: 'Error al actualizar la contraseña. Verifica tus credenciales actuales.'
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