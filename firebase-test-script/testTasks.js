// firebase-test-script/testTasks.js

// Importa las funciones necesarias de Firebase SDK para Web
// (Asegúrate de haber instalado 'firebase' con npm install firebase)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// **NOTA:** Si al ejecutar este script obtienes la advertencia
// "Warning: Module type of file:///... is not specified..."
// Abre tu archivo package.json en esta carpeta y añade la línea:
// "type": "module",
// justo después de la línea "version": "1.0.0", por ejemplo.


// Tu configuración de Firebase - ¡Pega aquí la misma configuración que usaste en testScript.js!
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
// Para un script simple de Node.js usando el SDK web, initializeApp debería ser llamado una vez
const app = initializeApp(firebaseConfig);

// Obtén la instancia de Cloud Firestore
const db = getFirestore(app);

console.log("--- Firebase Inicializado para Pruebas de Tareas ---");


// --- Función para Crear una Tarea (CORREGIDA) ---

/**
 * Crea un nuevo documento de tarea en la colección 'tareas'.
 *
 * @param {object} taskData Objeto con los datos de la tarea.
 * @param {string} taskData.title Título de la tarea.
 * @param {string} taskData.description Descripción de la tarea.
 * @param {string} taskData.status Estado inicial de la tarea (ej: 'Pendiente', 'En curso').
 * @param {string} taskData.createdByUid UID del usuario que crea la tarea.
 * @param {string | null} taskData.assignedToUid UID del usuario asignado a la tarea (o null si no está asignada).
 * @param {string} taskData.priority Prioridad de la tarea (ej: 'Alta', 'Media', 'Baja').
 * @param {Date} taskData.startTime Fecha y hora de inicio.
 * @param {Date} taskData.endTime Fecha y hora de fin.
 * @returns {Promise<{success: boolean, taskId?: string, error?: string, attemptedData?: object}>} Promesa que resuelve con el resultado de la operación.
 */
async function createTask(taskData) {
  console.log(`\nIntentando crear tarea con título: "${taskData.title}"`);

  // **IMPORTANTE:** Usa el nombre exacto de tu colección de tareas ('tareas')
  const tasksCollectionRef = collection(db, 'tasks');

  // Prepara los datos para el documento de Firestore
  // Declaramos newTaskData aquí para que esté disponible en try y catch
  const newTaskData = {
    title: taskData.title,
    description: taskData.description,
    status: taskData.status,
    createdBy: taskData.createdByUid,
    assignedTo: taskData.assignedToUid || null,
    priority: taskData.priority,
    startTime: taskData.startTime, // Asegúrate de que sea un objeto Date o Timestamp
    endTime: taskData.endTime,     // Asegúrate de que sea un objeto Date o Timestamp
    createdAt: new Date(), // Timestamp de creación
    // updatedAt: new Date(), // Puedes añadir un timestamp de última actualización si lo necesitas
  };


  try {
    // Usa addDoc para añadir un nuevo documento. Firestore generará automáticamente el ID.
    const docRef = await addDoc(tasksCollectionRef, newTaskData);

    console.log(`Tarea creada exitosamente con ID: ${docRef.id}`);
    console.log("Datos de la tarea creada (en éxito):", newTaskData); // Mantener aquí también para confirmación

    return { success: true, taskId: docRef.id, attemptedData: newTaskData }; // Devolver datos intentados

  } catch (error) {
    console.error('Error al crear la tarea en Firestore:', error);
    // Añadido: Imprimir los datos que intentaron ser escritos si ocurre un error
    console.error("Datos de la tarea que falló la creación:", newTaskData);

    // Aquí puedes añadir manejo específico de errores si es necesario (ej: permisos)
    // Si el error es de permisos, probablemente verás "FirebaseError: [code=permission-denied]"

    return { success: false, error: error.message, attemptedData: newTaskData }; // Devolver datos intentados incluso en fallo
  }
}


// --- Función Principal para Ejecutar las Pruebas de Tareas ---

async function runTestTasks() {
  console.log("\n--- Ejecutando script de prueba de creación de tareas ---");

  // **NOTA IMPORTANTE:**
  // Para que estas tareas se asocien correctamente, DEBES usar los UIDs reales
  // de usuarios que ya existen en tu proyecto de Firebase.
  // Puedes encontrar los UIDs en la sección "Authentication" de la consola de Firebase.
  // Reemplaza los valores de ejemplo con los UIDs que creaste con testScript.js
  // o que ya tienes en tu base de datos.
  const existingSuperAdminUid = 'yIUm0CB4w3MbvUHoD9L2Hpc3IGQ2'; // <-- Reemplaza con el UID real de un Admin
  const existingWorkerUid = 'gxoyKkAMIPMAeeoUHRZjIQhUkH52';   // <-- Reemplaza con el UID real de un Trabajador
  // Si necesitas otro UID, añádelo aquí


  // --- Pruebas de Creación de Tareas ---

  // Ejemplo 1: Tarea creada por Admin, asignada a Trabajador
  const taskData1 = {
      title: 'Implementar Login',
      description: 'Desarrollar la funcionalidad de inicio de sesión en React Native.',
      status: 'Pendiente', // Estado inicial
      createdByUid: existingSuperAdminUid, // Creada por el Super Admin (usando su UID)
      assignedToUid: existingWorkerUid,   // Asignada al Trabajador (usando su UID)
      priority: 'Alta',
      startTime: new Date(), // Fecha/Hora de inicio (Timestamp en Firestore)
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Fecha/Hora fin (Una semana después)
  };

  console.log("\n--- Creando Tarea 1 ---");
  const resultTask1 = await createTask(taskData1);
  console.log("Resultado Tarea 1:", resultTask1);


  // Ejemplo 2: Tarea creada por Admin, no asignada aún
  const taskData2 = {
      title: 'Diseñar Interfaz',
      description: 'Diseñar la interfaz de usuario principal de la app Tasky.',
      status: 'Pendiente',
      createdByUid: existingSuperAdminUid, // Creada por el Super Admin
      assignedToUid: null, // No asignada
      priority: 'Media',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Tres días después
  };

  console.log("\n--- Creando Tarea 2 ---");
  const resultTask2 = await createTask(taskData2);
  console.log("Resultado Tarea 2:", resultTask2);


  // Ejemplo 3: Tarea creada por Trabajador y asignada a sí mismo
  // (Nota: Esto requiere que tus reglas de seguridad permitan a los trabajadores crear tareas)
   const taskData3 = {
       title: 'Revisar Bug #101',
       description: 'Investigar y corregir el bug reportado con ID 101.',
       status: 'En curso', // Empieza directamente "En curso"
       createdByUid: existingWorkerUid, // Creada por el Trabajador
       assignedToUid: existingWorkerUid, // Asignada a sí mismo
       priority: 'Alta',
       startTime: new Date(),
       endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Un día después
   };

   console.log("\n--- Creando Tarea 3 (por Trabajador) ---");
   const resultTask3 = await createTask(taskData3);
   console.log("Resultado Tarea 3:", resultTask3);


  console.log("\n--- Script de prueba de creación de tareas finalizado ---");

  // Nota: Puedes añadir process.exit() aquí si necesitas forzar la salida
  // después de que todas las operaciones asíncronas hayan terminado.
}

// Ejecuta la función principal de pruebas de tareas
runTestTasks();