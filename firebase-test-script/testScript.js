// firebase-test-script/testScript.js

// Importa las funciones necesarias de Firebase
// Asegúrate de que estas importaciones estén al principio del archivo
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

// Tu configuración de Firebase - ¡Pega aquí la que copiaste de la consola!
// Reemplaza los valores de ejemplo con los de tu proyecto.
const firebaseConfig = {
    apiKey: "AIzaSyDawiw9RbKSqAL03zVVo4LIOi-ggE01f8w",
    authDomain: "tasky-69b74.firebaseapp.com",
    projectId: "tasky-69b74",
    storageBucket: "tasky-69b74.firebasestorage.app",
    messagingSenderId: "1069303930447",
    appId: "1:1069303930447:web:c977ee712c5afcf5c9143a",
    measurementId: "G-0W7B1PMRD2"
  };

// Inicializa Firebase y obtén instancias
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("--- Firebase Inicializado ---");
console.log("Listos para interactuar con Auth y Firestore.");


// --- Función para Crear Usuario con Verificación de RUT y Rol ---

/**
 * Crea una cuenta de usuario en Firebase Authentication y su documento de perfil en Firestore,
 * verificando la unicidad del RUT y asignando el rol isAdmin.
 *
 * @param {string} email Correo electrónico del usuario.
 * @param {string} password Contraseña del usuario (mínimo 6 caracteres para Firebase Auth).
 * @param {string} rut RUT del usuario (debe ser único).
 * @param {boolean} isAdmin Indica si el usuario es administrador (true) o trabajador (false).
 * @param {string} name Nombre del usuario.
 * @param {string} lastName Apellido del usuario.
 * @returns {Promise<{success: boolean, user?: object, error?: string}>} Promesa que resuelve con el resultado de la operación.
 */
async function createUserWithRUTAndRole(email, password, rut, isAdmin, name, lastName) {
  console.log(`\nIntentando crear usuario con RUT: ${rut}, Email: ${email}`);

  try {
    // 1. Verificar si el RUT ya existe en Cloud Firestore (Tarea "Rut de usuario único en BDD")
    // **IMPORTANTE:** Usa el nombre exacto de tu colección de usuarios ('users' o 'usuarios1')
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('rut', '==', rut)); // Crea una consulta para encontrar el RUT
    const querySnapshot = await getDocs(q); // Ejecuta la consulta

    if (!querySnapshot.empty) {
      // Si se encontraron documentos con ese RUT, significa que ya está registrado
      const errorMessage = `Error al crear usuario: El RUT ${rut} ya está registrado.`;
      console.error(errorMessage);
      // Aunque imprimimos, lanzamos un error para que el catch lo capture y el resultado indique fallo
      throw new Error(errorMessage);
    }

    console.log(`RUT ${rut} es único. Procediendo con la creación de la cuenta en Authentication...`);

    // 2. Crear la cuenta de usuario en Firebase Authentication
    // Firebase Auth maneja la validación básica de email/password y la seguridad de la contraseña.
    // La contraseña debe tener al menos 6 caracteres.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user; // Obtenemos el objeto de usuario creado por Auth

    console.log(`Cuenta de Authentication creada exitosamente para el email ${email} con UID: ${user.uid}`);

    // 3. Crear el documento de perfil en Cloud Firestore (Tarea "Asignar rol a Usuario en BDD")
    // Usamos el UID de Authentication como el ID del documento en la colección 'users'
    // **IMPORTANTE:** Usa el nombre exacto de tu colección de usuarios ('users' o 'usuarios1')
    const userDocRef = doc(db, 'users', user.uid);

    const userData = {
      uid: user.uid, // Guardamos el UID también como campo
      rut: rut, // Incluimos el RUT
      email: email, // Incluimos el email (opcional, pero útil)
      isAdmin: isAdmin, // Asignamos el rol booleano (true o false)
      name: name, // Incluimos el nombre
      lastName: lastName, // Incluimos el apellido
      createdAt: new Date(), // Opcional: Marca de tiempo de creación
      // NO incluir la contraseña aquí por seguridad
    };

    // Usamos setDoc para crear el documento del usuario con la estructura definida
    await setDoc(userDocRef, userData);

    console.log(`Documento de usuario creado/actualizado en Firestore para UID ${user.uid}.`);
    console.log("Usuario creado exitosamente:", userData);

    return { success: true, user: userData }; // Indicamos éxito y devolvemos los datos del usuario

  } catch (error) {
    console.error('Error en el proceso de creación de usuario:', error.message);

    // Manejo de errores específicos de Firebase Authentication
    if (error.code === 'auth/email-already-in-use') {
      console.error('Motivo del error: Este correo electrónico ya está registrado en Firebase Authentication.');
    } else if (error.code === 'auth/weak-password') {
        console.error('Motivo del error: La contraseña es demasiado débil.');
    } else if (error.code === 'auth/invalid-email') {
        console.error('Motivo del error: El formato del correo electrónico es inválido.');
    } // Puedes añadir más casos de error de Auth según sea necesario

    // Si hubo un error después de crear en Auth pero antes de guardar en Firestore
    // (por ejemplo, un error de permisos en las reglas de seguridad de Firestore)
    // Firebase Auth ya creó la cuenta. Podrías querer eliminar esa cuenta de Auth
    // para evitar cuentas "huérfanas" que no tienen documento de perfil.
    // Esto requiere lógica adicional si es un escenario que esperas manejar.

    return { success: false, error: error.message }; // Indicamos fallo y devolvemos el mensaje de error
  }
}

// --- Función Principal para Ejecutar las Pruebas ---
async function runTest() {
  console.log("\n--- Ejecutando script de prueba de creación de usuarios ---");

  // --- Prueba de Creación de Usuario ---

  // **NOTA IMPORTANTE:**
  // Si ejecutas el script varias veces, los usuarios creados en Authentication
  // y sus documentos en Firestore persistirán. Para probar la creación exitosa
  // múltiples veces, deberás eliminar manualmente los usuarios de Authentication
  // y/o sus documentos en Firestore en la consola de Firebase entre ejecuciones,
  // o cambiar los datos de prueba (email y RUT) para que sean únicos.

  // --- Ejemplo 1: Crear un Super Administrador ---
  const superAdminData = {
      email: 'superadmin@taskyapp.com', // Cambia si ya existe
      password: 'PasswordSeguro123!', // Usa una contraseña segura para pruebas (>= 6 caracteres)
      rut: '11222333-4', // Cambia si ya existe
      isAdmin: true, // Es administrador
      name: 'Super',
      lastName: 'Admin'
  };

  console.log("\n--- Creando Super Administrador ---");
  const resultSuperAdmin = await createUserWithRUTAndRole(
      superAdminData.email,
      superAdminData.password,
      superAdminData.rut,
      superAdminData.isAdmin,
      superAdminData.name,
      superAdminData.lastName
  );
  console.log("Resultado Super Admin:", resultSuperAdmin);


  // --- Ejemplo 2: Crear un Trabajador ---
   const workerData = {
      email: 'trabajador1@taskyapp.com', // Cambia si ya existe
      password: 'PasswordTrabajador456', // >= 6 caracteres
      rut: '22333444-5', // Cambia si ya existe
      isAdmin: false, // Es trabajador
      name: 'Juan',
      lastName: 'Perez'
  };

  console.log("\n--- Creando Trabajador 1 ---");
  const resultWorker1 = await createUserWithRUTAndRole(
      workerData.email,
      workerData.password,
      workerData.rut,
      workerData.isAdmin,
      workerData.name,
      workerData.lastName
  );
   console.log("Resultado Trabajador 1:", resultWorker1);


  // --- Ejemplo 3: Intentar crear un usuario con un RUT que ya existe ---
  const duplicateRutData = {
      email: 'otroemailpararutduplicado@taskyapp.com', // Asegúrate de que este email no exista en Auth
      password: 'passwordduplicado', // >= 6 caracteres
      rut: '11222333-4', // <-- RUT del superadmin ya creado (ejemplo)
      isAdmin: false,
      name: 'Usuario',
      lastName: 'DuplicadoRUT'
  };

   console.log("\n--- Intentando crear usuario con RUT duplicado ---");
   const resultDuplicateRut = await createUserWithRUTAndRole(
      duplicateRutData.email,
      duplicateRutData.password,
      duplicateRutData.rut,
      duplicateRutData.isAdmin,
      duplicateRutData.name,
      duplicateRutData.lastName
   );
   console.log("Resultado RUT duplicado:", resultDuplicateRut);


   // --- Ejemplo 4: Intentar crear un usuario con un Email que ya existe en Firebase Auth ---
   // Este ejemplo solo probará el error de "email-already-in-use" de Auth
   // si el email ya existe en Auth Y el RUT AUN NO existe en Firestore.
   // Con nuestra lógica, la verificación de RUT se hace primero.
   // Si quieres forzar la prueba del error de email duplicado de Auth,
   // puedes comentar temporalmente la sección de "Verificar si el RUT ya existe"
   // dentro de la función createUserWithRUTAndRole.
    const duplicateEmailData = {
        email: 'superadmin@taskyapp.com', // <-- Email ya usado (ejemplo)
        password: 'nuevapassword', // >= 6 caracteres
        rut: '99888777-0', // Asegúrate de que este RUT sea único en Firestore
        isAdmin: false,
        name: 'Email',
        lastName: 'DuplicadoEmail'
    };
     console.log("\n--- Intentando crear usuario con Email duplicado en Auth ---");
     const resultDuplicateEmail = await createUserWithRUTAndRole(
         duplicateEmailData.email,
         duplicateEmailData.password,
         duplicateEmailData.rut,
         duplicateEmailData.isAdmin,
         duplicateEmailData.name,
         duplicateEmailData.lastName
     );
     console.log("Resultado Email duplicado:", resultDuplicateEmail);


  console.log("\n--- Script de prueba de creación de usuarios finalizado ---");

  // Nota: En un script de Node.js, las operaciones asíncronas pueden hacer que el script
  // termine antes de completarse si no se maneja explícitamente la salida.
  // Para pruebas simples como esta, a menudo no es un problema si todas las
  // promesas son `await` ed. Si necesitas forzar la salida después de que todo
  // termine, podrías usar process.exit() al final de runTest después de asegurar
  // que todas las operaciones async han finalizado. Por ahora, dejemos que Node.js
  // decida cuándo salir.
}

// Ejecuta la función principal de prueba
runTest();