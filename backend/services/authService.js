
//Creacion de usuarios por parte del admin:)

const admin = require('firebase-admin');

exports.createUserWithRole = async (userData) => { // i) función como asíncrona
    const { email, password, rut, name, lastName, role, isAdmin } = userData;

try {

    // 1. Crear en Firebase Auth
    const userRecord = await admin.auth().createUser({ // ii) Espera esta promesa
        email: email, // Requerido por Firebase
        password: password // Requerido por Firebase
    });
  
const firebaseUid = userRecord.uid; // iii) Obtener el UID del usuario creado
    // 2. Guardar en Firestore 
    // iii) Esto se ejecuta SOLO cuando createUser() termine
    await admin.firestore().collection('users').doc(firebaseUid).set({   

      isAdmin: isAdmin, //  Fijo en false
      name: name,
      lastName: lastName,
      email: email,
      rut: rut,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  
     return {
            message: "Usuario creado exitosamente",
            user: {
                uid: firebaseUid, // Asegúrate de que se use aquí
                email: email,
                rut: rut,
                name: name,
                lastName: lastName,
                role: role,
                isAdmin: isAdmin
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
  