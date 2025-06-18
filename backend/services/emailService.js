require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuración del transporter de correo
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.TASKY_EMAIL, 
        pass: process.env.TASKY_KEY
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
        from: process.env.TASKY_EMAIL,
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
        from: process.env.TASKY_EMAIL,
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

// Función para generar una contraseña temporal aleatoria
const generateTempPassword = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// Función para enviar la contraseña temporal
const sendTempPassword = async (email, tempPassword) => {
    const mailOptions = {
        from: process.env.TASKY_EMAIL,
        to: email,
        subject: 'Tu contraseña temporal para Tasky',
        text: `Bienvenido a Tasky. Tu contraseña temporal es: ${tempPassword}`,
        html: `<h1>Bienvenido a Tasky</h1><p>Tu contraseña temporal es:</p><h2>${tempPassword}</h2><p>Por favor, cámbiala después de iniciar sesión.</p>`
    };
    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Error al enviar la contraseña temporal:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendRecoveryCode,
    sendTestEmail,
    sendTempPassword,
    generateTempPassword
};