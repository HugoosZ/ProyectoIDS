//Creacion de usuarios por parte del admin:)
const { db } = require("../firebase");
const admin = require('firebase-admin');

exports.createUserWithRole = async (userData) => { // i) función como asíncrona
    const { email, password, rut, name, lastName, role, isAdmin, empresaId, rutHash } = userData;

    try {
        // 1. Crear en Firebase Auth
        const userRecord = await admin.auth().createUser({ // ii) Espera esta promesa
            uid: rut,
            email: email, // Requerido por Firebase
            password: password // Requerido por Firebase
        });

        // 2. Guardar en Firestore 
        // iii) Esto se ejecuta SOLO cuando createUser() termine
        await admin.firestore().collection('users').doc(rut).set({
        isAdmin: isAdmin, //  Fijo en false
        name: name,
        lastName: lastName,
        email: email,
        rut: rut,
        rutHash,
        role: role,
        empresaId: empresaId,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    
        return {
                message: "Usuario creado exitosamente",
                user: {
                    uid: rut, 
                    email: email,
                    rut: rut,
                    role: role,
                    empresaId: empresaId,
                }
            };
    }
    
    catch (error) { 
        console.error("Error en authService.createUserWithRole:", error);

        if (error.message === 'El RUT ya está registrado.') {
            throw new Error(error.message);
        } else if (error.code === 'auth/email-already-exists') {
            throw new Error('El email ya está registrado.');
        } else if (error.code === 'auth/invalid-password') {
            throw new Error('La contraseña debe tener al menos 6 caracteres.');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('El email proporcionado no es válido.');
        } else {
            throw new Error('Error interno del servidor al crear usuario: ' + error.message);
        }
    }
}

exports.getAllUsersRaw = async () => {
    try {
        const usersSnapshot = await db.collection('users').get();
        return usersSnapshot; // Devuelve el QuerySnapshot directamente
    } catch (error) {
        console.error("Error al obtener todos los usuarios (raw):", error);
        throw new Error("No se pudieron obtener los usuarios para validación.");
    }
};