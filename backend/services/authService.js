
//Creacion de usuarios por parte del admin:)

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

exports.createUserWithRole = async (userData) => { // i) función como asíncrona
    const { email, password, rut, name, lastName, role, isAdmin, empresaId } = userData;

try {
    const uniqueFirebaseUid = uuidv4(); // Genera un UID único para el usuario
    // 1. Crear en Firebase Auth
    const userRecord = await admin.auth().createUser({ // ii) Espera esta promesa
        uid: uniqueFirebaseUid, // Asigna el UID único generado
        email: email, // Requerido por Firebase
        password: password // Requerido por Firebase
    });

    // 2. Guardar en Firestore 
    // iii) Esto se ejecuta SOLO cuando createUser() termine
    await admin.firestore().collection('users').doc(uniqueFirebaseUid).set({   

      isAdmin: isAdmin, //  Fijo en false
      name: name,
      lastName: lastName,
      email: email,
      rut: rut,
      role: role,
      empresaId: empresaId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  
     return {
            message: "Usuario creado exitosamente",
            user: {
                uid: uniqueFirebaseUid, 
                email: email,
                rut: rut,
                name: name,
                lastName: lastName,
                role: role,
                isAdmin: isAdmin,
                empresaId: empresaId 
            }
        };
    }
    catch (error) { // <-- Asegúrate de que el 'catch' esté aquí
        console.error("Error en authService.createUserWithRole:", error);
        if (error.code === 'auth/email-already-exists') {
            throw new Error('El email ya está registrado.');
        } else if (error.code === 'auth/invalid-password') {
            throw new Error('La contraseña debe tener al menos 6 caracteres.');
        } else {
            throw new Error('Error interno del servidor al crear usuario: ' + error.message);
        }
    }
}
  