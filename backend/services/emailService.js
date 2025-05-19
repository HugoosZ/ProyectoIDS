require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuración del transporter de correo
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Función para generar un código aleatorio de 6 dígitos
const generateRecoveryCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Función para enviar el código de recuperación
const sendRecoveryCode = async (email) => {
    const recoveryCode = generateRecoveryCode();
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Código de Recuperación de Contraseña',
        text: `Tu código de recuperación es: ${recoveryCode}`,
        html: `
            <h1>Recuperación de Contraseña</h1>
            <p>Tu código de recuperación es:</p>
            <h2>${recoveryCode}</h2>
            <p>Este código expirará en 10 minutos.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, code: recoveryCode };
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        return { success: false, error: error.message };
    }
};

// Función para enviar un correo de prueba
const sendTestEmail = async () => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'hugo.rojas1@mail.udp.cl',
        subject: 'Correo de Prueba',
        text: 'Hola Hugo',
        html: '<h1>Hola Hugo</h1>'
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error al enviar el correo de prueba:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendRecoveryCode,
    sendTestEmail
}; 