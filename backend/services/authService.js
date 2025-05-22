
//Creacion de usuarios por parte del admin:)

const admin = require('firebase-admin');

exports.createUserWithRole = async (userData) => { // i) función como asíncrona
    const { email, password, rut, name, lastName, role, isAdmin } = userData;

    // 1. Crear en Firebase Auth
    const userRecord = await admin.auth().createUser({ // ii) Espera esta promesa
        uid: rut,
        email: email, // Requerido por Firebase
        password
    });
  
    // 2. Guardar en Firestore 
    // iii) Esto se ejecuta SOLO cuando createUser() termine
    await admin.firestore().collection('users').doc(rut).set({   

      isAdmin, //  Fijo en false
      name,
      lastName,
      email,
      rut,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  
    return { rut, email, name, lastName, role }; 
  };
  