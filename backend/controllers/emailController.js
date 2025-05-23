const emailService = require('../services/emailService');

const handlePasswordRecovery = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'El correo electrónico es requerido' 
        });
    }

    try {
        const result = await emailService.sendRecoveryCode(email);
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Código de recuperación enviado',
                code: result.code 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Error al enviar el código de recuperación',
                error: result.error 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor',
            error: error.message 
        });
    }
};

const sendTestEmail = async (req, res) => {
    try {
        const result = await emailService.sendTestEmail();
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Correo de prueba enviado exitosamente' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Error al enviar el correo de prueba',
                error: result.error 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor',
            error: error.message 
        });
    }
};

module.exports = {
    handlePasswordRecovery,
    sendTestEmail
}; 