// firebase-test-script/testTaskQueries.js

// Importa las funciones necesarias de Firebase SDK para Web
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'; // Necesitamos getDocs, collection, query, where

// **NOTA:** Si al ejecutar este script obtienes la advertencia
// "Warning: Module type of file:///... is not specified..."
// Abre tu archivo package.json en esta carpeta y añade la línea:
// "type": "module",
// justo después de la línea "version": "1.0.0", por ejemplo.


// Tu configuración de Firebase - ¡Pega aquí la misma configuración que usaste en testScript.js y testTasks.js!
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

// Obtén la instancia de Cloud Firestore
const db = getFirestore(app);

console.log("--- Firebase Inicializado para Pruebas de Consulta de Tareas ---");


// --- Función para Obtener Tareas Asignadas a un Usuario ---

/**
 * Obtiene todas las tareas asignadas a un usuario específico.
 *
 * @param {string} userId UID del usuario cuyas tareas asignadas se quieren obtener.
 * @returns {Promise<{success: boolean, tasks?: Array<object>, error?: string}>} Promesa que resuelve con el resultado de la operación.
 */
async function getTasksAssignedToUser(userId) {
  console.log(`\nIntentando obtener tareas asignadas a UID: ${userId}`);

  // **IMPORTANTE:** Usa el nombre exacto de tu colección de tareas ('tareas')
  const tasksCollectionRef = collection(db, 'tasks');

  // Crea una consulta: busca documentos en 'tareas' donde el campo 'assignedTo' sea igual al userId proporcionado
  const q = query(tasksCollectionRef, where('assignedTo', '==', userId));

  try {
    // Ejecuta la consulta
    const querySnapshot = await getDocs(q);

    const tasks = [];
    // Itera sobre los documentos encontrados en el snapshot
    querySnapshot.forEach((doc) => {
      // 'doc.id' es el ID auto-generado del documento
      // 'doc.data()' es el objeto con los datos del documento
      tasks.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Encontradas ${tasks.length} tareas asignadas a UID: ${userId}`);
    // console.log("Tareas encontradas:", tasks); // Descomenta para ver los datos completos

    return { success: true, tasks: tasks };

  } catch (error) {
    console.error(`Error al obtener tareas asignadas a ${userId}:`, error);
    // Probablemente sea un error de permisos si las reglas de lectura no están configuradas.
    return { success: false, error: error.message };
  }
}


// --- Función para Obtener Tareas Creadas por un Usuario ---

/**
 * Obtiene todas las tareas creadas por un usuario específico.
 *
 * @param {string} userId UID del usuario cuyas tareas creadas se quieren obtener.
 * @returns {Promise<{success: boolean, tasks?: Array<object>, error?: string}>} Promesa que resuelve con el resultado de la operación.
 */
async function getTasksCreatedByUser(userId) {
  console.log(`\nIntentando obtener tareas creadas por UID: ${userId}`);

  // **IMPORTANTE:** Usa el nombre exacto de tu colección de tareas ('tareas')
  const tasksCollectionRef = collection(db, 'tasks');

  // Crea una consulta: busca documentos en 'tareas' donde el campo 'createdBy' sea igual al userId proporcionado
  const q = query(tasksCollectionRef, where('createdBy', '==', userId));

  try {
    const querySnapshot = await getDocs(q);

    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });

    console.log(`Encontradas ${tasks.length} tareas creadas por UID: ${userId}`);
    // console.log("Tareas encontradas:", tasks); // Descomenta para ver los datos completos

    return { success: true, tasks: tasks };

  } catch (error) {
    console.error(`Error al obtener tareas creadas por ${userId}:`, error);
    return { success: false, error: error.message };
  }
}


// --- Función para Obtener Tareas Asignadas a un Usuario por Estado ---

/**
 * Obtiene tareas asignadas a un usuario con un estado específico.
 *
 * @param {string} userId UID del usuario asignado.
 * @param {string} status Estado de la tarea (ej: 'Pendiente', 'En curso').
 * @returns {Promise<{success: boolean, tasks?: Array<object>, error?: string}>} Promesa que resuelve con el resultado de la operación.
 */
async function getTasksAssignedToUserByStatus(userId, status) {
    console.log(`\nIntentando obtener tareas asignadas a UID: ${userId} con estado: "${status}"`);

    // **IMPORTANTE:** Usa el nombre exacto de tu colección de tareas ('tareas')
    const tasksCollectionRef = collection(db, 'tareas');

    // Crea una consulta con DOS condiciones 'where': asignado a X Y estado es Y
    const q = query(
        tasksCollectionRef,
        where('assignedTo', '==', userId),
        where('status', '==', status)
    );

    try {
        const querySnapshot = await getDocs(q);

        const tasks = [];
        querySnapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() });
        });

        console.log(`Encontradas ${tasks.length} tareas asignadas a UID: ${userId} con estado "${status}".`);
        // console.log("Tareas encontradas:", tasks); // Descomenta para ver los datos completos

        return { success: true, tasks: tasks };

    } catch (error) {
        console.error(`Error al obtener tareas asignadas a ${userId} por estado ${status}:`, error);
        return { success: false, error: error.message };
    }
}


// --- Función Principal para Ejecutar las Pruebas de Consulta de Tareas ---

async function runTestTaskQueries() {
  console.log("\n--- Ejecutando script de prueba de consulta de tareas ---");

  // **NOTA IMPORTANTE:**
  // Para que estas consultas funcionen, DEBES usar los UIDs reales
  // de usuarios que ya existen en tu proyecto de Firebase y que tienen tareas asociadas.
  // Puedes encontrar los UIDs en la sección "Authentication" de la consola de Firebase
  // y verificar las tareas en la colección 'tareas' para ver qué UIDs están en 'createdBy' y 'assignedTo'.
  // Reemplaza los valores de ejemplo con los UIDs reales.
  const existingSuperAdminUid = 'yIUm0CB4w3MbvUHoD9L2Hpc3IGQ2'; // <-- Reemplaza con el UID real
  const existingWorkerUid = 'gxoyKkAMIPMAeeoUHRZjIQhUkH52';   // <-- Reemplaza con el UID real
  // Si necesitas otro UID con tareas, añádelo aquí


  // --- Pruebas de Consulta ---

  // Consulta 1: Obtener todas las tareas asignadas al Trabajador
  console.log("\n--- Consulta: Tareas Asignadas al Trabajador ---");
  const resultAssignedToWorker = await getTasksAssignedToUser(existingWorkerUid);
  console.log(`Resultado: ${resultAssignedToWorker.success ? `${resultAssignedToWorker.tasks.length} tareas encontradas.` : resultAssignedToWorker.error}`);
  if (resultAssignedToWorker.success && resultAssignedToWorker.tasks && resultAssignedToWorker.tasks.length > 0) {
       console.log("Datos de la primera tarea encontrada:", resultAssignedToWorker.tasks[0]); // Muestra la primera como ejemplo
  }


  // Consulta 2: Obtener todas las tareas creadas por el Super Administrador
  console.log("\n--- Consulta: Tareas Creadas por el Admin ---");
  const resultCreatedByAdmin = await getTasksCreatedByUser(existingSuperAdminUid);
  console.log(`Resultado: ${resultCreatedByAdmin.success ? `${resultCreatedByAdmin.tasks.length} tareas encontradas.` : resultCreatedByAdmin.error}`);
   if (resultCreatedByAdmin.success && resultCreatedByAdmin.tasks && resultCreatedByAdmin.tasks.length > 0) {
        console.log("Datos de la primera tarea encontrada:", resultCreatedByAdmin.tasks[0]); // Muestra la primera como ejemplo
   }


  // Consulta 3: Obtener tareas asignadas al Trabajador que están "Pendiente"
  const statusToQuery = 'Pendiente'; // O 'En curso', 'Completada', etc., según tus datos
  console.log(`\n--- Consulta: Tareas Asignadas al Trabajador (${existingWorkerUid}) con estado "${statusToQuery}" ---`);
  const resultAssignedToWorkerPending = await getTasksAssignedToUserByStatus(existingWorkerUid, statusToQuery);
   console.log(`Resultado: ${resultAssignedToWorkerPending.success ? `${resultAssignedToWorkerPending.tasks.length} tareas encontradas.` : resultAssignedToWorkerPending.error}`);
    if (resultAssignedToWorkerPending.success && resultAssignedToWorkerPending.tasks && resultAssignedToWorkerPending.tasks.length > 0) {
         console.log(`Datos de la primera tarea encontrada:`, resultAssignedToWorkerPending.tasks[0]); // Muestra la primera como ejemplo
    }


  console.log("\n--- Script de prueba de consulta de tareas finalizado ---");

  // Nota: Puedes añadir process.exit() aquí si necesitas forzar la salida
  // después de que todas las operaciones asíncronas hayan terminado.
}

// Ejecuta la función principal de pruebas de consulta de tareas
runTestTaskQueries();