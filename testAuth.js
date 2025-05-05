// firebase-test-script/testAuth.js

// Importa las funciones necesarias de Firebase SDK para Web
import { initializeApp } from 'firebase/app';
import {
    getAuth, // Necesario para obtener la instancia de Auth
    signInWithEmailAndPassword, // Para iniciar sesión
    sendPasswordResetEmail, // Para restablecer contraseña
    updateEmail, // Para cambiar email
    updatePassword, // Para cambiar contraseña
    // Puedes necesitar reauthenticateWithCredential si el usuario no se autenticó recientemente antes de actualizar email/password
    // EmailAuthProvider // Para crear credenciales para reautenticación si es necesario
} from 'firebase/auth';

// **NOTA:** Si al ejecutar este script obtienes la advertencia
// "Warning: Module type of file:///... is not specified..."
// Abre tu archivo package.json en esta carpeta y añade la línea:
// "type": "module",
// justo después de la línea "version": "1.0.0", por ejemplo.


// Tu configuración de Firebase - ¡Pega aquí la misma configuración que usaste en los otros scripts!
// Reemplaza los valores de ejemplo con los datos reales de tu proyecto de Firebase.
const firebaseConfig = {
    apiKey: "AIzaSyDawiw9RbKSqAL03zVVo4LIOi-ggE01f8w",
    authDomain: "tasky-69b74.firebaseapp.com",
    projectId: "tasky-69b74",
    storageBucket: "tasky-69b74.firebasestorage.app",
    messagingSenderId: "1069303930447",
    appId: "1:1069303930447:web:c977ee712c5afcf5c9143a",
    measurementId: "G-0W7B1PMRD2"
  };

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Obtén la instancia de Authentication
const auth = getAuth(app);

console.log("--- Firebase Inicializado para Pruebas de Autenticación ---");


// --- Función para Iniciar Sesión ---

/**
 * Intenta iniciar sesión con correo electrónico y contraseña.
 *
 * @param {string} email Correo electrónico del usuario.
 * @param {string} password Contraseña del usuario.
 * @returns {Promise<{success: boolean, user?: object, error?: string}>} Promesa que resuelve con el resultado de la operación.
 */
async function loginUser(email, password) {
  console.log(`\nIntentando iniciar sesión con email: ${email}`);
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`Sesión iniciada exitosamente para el usuario con UID: ${user.uid}`);
    return { success: true, user: user };
  } catch (error) {
    console.error('Error al iniciar sesión:', error.message);
    // Puedes añadir manejo de errores específicos de Auth, ej: 'auth/user-not-found', 'auth/wrong-password'
    return { success: false, error: error.message };
  }
}


// --- Función para Enviar Correo de Restablecimiento de Contraseña ---

/**
 * Envía un correo electrónico para restablecer la contraseña a la dirección proporcionada.
 *
 * @param {string} email Correo electrónico del usuario.
 * @returns {Promise<{success: boolean, error?: string}>} Promesa que resuelve con el resultado de la operación.
 */
async function sendPasswordReset(email) {
  console.log(`\nIntentando enviar correo de restablecimiento de contraseña a: ${email}`);
  try {
    await sendPasswordResetEmail(auth, email);
    console.log(`Correo de restablecimiento de contraseña enviado exitosamente a ${email}.`);
    console.log("Verifica la bandeja de entrada de ese correo electrónico.");
    return { success: true };
  } catch (error) {
    console.error('Error al enviar correo de restablecimiento de contraseña:', error.message);
    // Puedes manejar errores específicos, ej: 'auth/user-not-found', 'auth/invalid-email'
    return { success: false, error: error.message };
  }
}


// --- Función para Actualizar el Correo Electrónico del Usuario Autenticado ---

/**
 * Actualiza el correo electrónico del usuario actualmente autenticado.
 * NOTA: Esta operación requiere que el usuario se haya autenticado recientemente.
 * Si no es así, puede ser necesario re-autenticar al usuario antes de llamar a esta función.
 *
 * @param {object} user El objeto de usuario autenticado (ej: auth.currentUser).
 * @param {string} newEmail El nuevo correo electrónico.
 * @returns {Promise<{success: boolean, error?: string}>} Promesa que resuelve con el resultado de la operación.
 */
async function updateUserEmail(user, newEmail) {
    if (!user) {
        console.error("\nError al actualizar email: No hay usuario autenticado.");
        return { success: false, error: 'No hay usuario autenticado.' };
    }
    console.log(`\nIntentando actualizar el email del usuario ${user.uid} a: ${newEmail}`);
     try {
        await updateEmail(user, newEmail);
        console.log(`Email del usuario ${user.uid} actualizado exitosamente a ${newEmail}.`);
        return { success: true };
     } catch (error) {
        console.error(`Error al actualizar el email del usuario ${user.uid}:`, error.message);
        // El error 'auth/requires-recent-login' es común aquí si el usuario no se autenticó recientemente.
        // También 'auth/invalid-email', 'auth/email-already-in-use'
        return { success: false, error: error.message };
     }
}

// --- Función para Actualizar la Contraseña del Usuario Autenticado ---

/**
 * Actualiza la contraseña del usuario actualmente autenticado.
 * NOTA: Esta operación requiere que el usuario se haya autenticado recientemente.
 * Si no es así, puede ser necesario re-autenticar al usuario antes de llamar a esta función.
 *
 * @param {object} user El objeto de usuario autenticado (ej: auth.currentUser).
 * @param {string} newPassword La nueva contraseña (mínimo 6 caracteres).
 * @returns {Promise<{success: boolean, error?: string}>} Promesa que resuelve con el resultado de la operación.
 */
async function updateUserPassword(user, newPassword) {
    if (!user) {
        console.error("\nError al actualizar contraseña: No hay usuario autenticado.");
        return { success: false, error: 'No hay usuario autenticado.' };
    }
     console.log(`\nIntentando actualizar la contraseña del usuario ${user.uid}.`);
     try {
        await updatePassword(user, newPassword);
        console.log(`Contraseña del usuario ${user.uid} actualizada exitosamente.`);
        return { success: true };
     } catch (error) {
        console.error(`Error al actualizar la contraseña del usuario ${user.uid}:`, error.message);
         // El error 'auth/requires-recent-login' es común aquí.
         // También 'auth/weak-password'
        return { success: false, error: error.message };
     }
}


// --- Función Principal para Ejecutar las Pruebas de Autenticación ---

async function runTestAuth() {
  console.log("\n--- Ejecutando script de prueba de autenticación ---");

  // **NOTA IMPORTANTE:**
  // Para las pruebas de login, actualizar email/password,
  // necesitas las credenciales (email y contraseña) de un usuario
  // que ya exista en Firebase Authentication.
  // Usa el email y la contraseña de un usuario que creaste con testScript.js.
  const existingUserEmail = 'superadmin@taskyapp.com'; // <-- Reemplaza con un email de usuario existente
  const existingUserPassword = 'PasswordSeguro123!'; // <-- Reemplaza con la contraseña de ese usuario


  // --- Prueba de Login ---
  console.log("\n--- Prueba de Inicio de Sesión ---");
  const loginResult = await loginUser(existingUserEmail, existingUserPassword);
  console.log("Resultado Login:", loginResult);

  // Si el login fue exitoso, podemos intentar actualizar credenciales
  if (loginResult.success && loginResult.user) {
      const authenticatedUser = loginResult.user;

      // --- Pruebas de Actualización de Credenciales (requiere login exitoso) ---
      console.log("\n--- Prueba de Actualización de Email ---");
      const newEmail = 'superadmin.nuevo@taskyapp.com'; // Un email nuevo y que no esté en uso por otro usuario
      const updateEmailResult = await updateUserEmail(authenticatedUser, newEmail);
      console.log("Resultado Actualización Email:", updateEmailResult);
      // Nota: Después de actualizar el email, el usuario necesitará verificar el nuevo email.
      // Además, para futuras operaciones que requieran autenticación reciente (como otra actualización),
      // necesitarás re-autenticarte con la nueva contraseña.
      // Si la actualización de email falla, el usuario autenticado sigue siendo el original con el email viejo.

      console.log("\n--- Prueba de Actualización de Contraseña ---");
       const newPassword = 'NuevaPasswordMasSegura456!'; // Una contraseña nueva y segura (>= 6 caracteres)
       // Nota: Después de cambiar la contraseña, el usuario actual NO se desautentica,
       // pero cualquier token de autenticación viejo se invalidará al cabo de un tiempo.
       // Para futuras operaciones que requieran autenticación reciente, necesitarás re-autenticarte
       // CON LA NUEVA CONTRASEÑA.
       const updatePasswordResult = await updateUserPassword(authenticatedUser, newPassword);
       console.log("Resultado Actualización Contraseña:", updatePasswordResult);

       // Nota sobre Re-autenticación: Si las operaciones updateEmail/updatePassword fallan con
       // 'auth/requires-recent-login', significa que el usuario no se autenticó (login)
       // lo suficientemente reciente. En una app real, le pedirías al usuario que ingrese su
       // contraseña actual de nuevo justo antes de la actualización y usarías
       // reauthenticateWithCredential(user, credential) para "refrescar" su autenticación.
       // Esto no es fácil de probar en un script simple, pero es un concepto importante.
  } else {
      console.log("\nLogin fallido. No se pueden realizar pruebas de actualización de credenciales.");
  }


  // --- Prueba de Restablecimiento de Contraseña ---
  console.log("\n--- Prueba de Restablecimiento de Contraseña ---");
   const emailToReset = 'cristobal.rodriguez2@mail.udp.cl'; // Email de un usuario existente para enviar el reset
   const resetPasswordResult = await sendPasswordReset(emailToReset);
   console.log("Resultado Restablecimiento Contraseña:", resetPasswordResult);


  console.log("\n--- Script de prueba de autenticación finalizado ---");

  // Nota: Puedes añadir process.exit() aquí si necesitas forzar la salida.
}

// Ejecuta la función principal de pruebas de autenticación
runTestAuth();