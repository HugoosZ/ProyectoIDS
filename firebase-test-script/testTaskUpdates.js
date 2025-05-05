// firebase-test-script/testTaskUpdates.js

// Importa las funciones necesarias de Firebase SDK para Web
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore'; // Necesitamos doc y updateDoc

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

// Obtén la instancia de Cloud Firestore
const db = getFirestore(app);

console.log("--- Firebase Inicializado para Pruebas de Actualización de Tareas ---");


// --- Función para Actualizar el Estado (u otros campos) de una Tarea ---

/**
 * Actualiza campos específicos de un documento de tarea.
 *
 * @param {string} taskId El ID del documento de la tarea a actualizar.
 * @param {object} updates Un objeto donde las claves son los campos a actualizar y los valores son los nuevos valores.
 * @returns {Promise<{success: boolean, error?: string}>} Promesa que resuelve con el resultado de la operación.
 */
async function updateTask(taskId, updates) {
  console.log(`\nIntentando actualizar tarea con ID: ${taskId}`);
  console.log("Campos a actualizar:", updates);

  // **IMPORTANTE:** Usa el nombre exacto de tu colección de tareas ('tareas' o 'tasks')
  const taskDocRef = doc(db, 'tasks', taskId); // Obtiene la referencia al documento específico

  try {
    // Usa updateDoc para actualizar solo los campos proporcionados en el objeto 'updates'
    await updateDoc(taskDocRef, updates);

    console.log(`Tarea ${taskId} actualizada exitosamente.`);

    return { success: true };

  } catch (error) {
    console.error(`Error al actualizar tarea ${taskId}:`, error);

    // Puede ser un error de permisos si las reglas de escritura no permiten actualizar.
    // Si el error es de permisos, probablemente verás "FirebaseError: [code=permission-denied]"

    return { success: false, error: error.message };
  }
}


// --- Función Principal para Ejecutar las Pruebas de Actualización de Tareas ---

async function runTestTaskUpdates() {
  console.log("\n--- Ejecutando script de prueba de actualización de tareas ---");

  // **NOTA IMPORTANTE:**
  // Para que estas pruebas funcionen, DEBES proporcionar el ID REAL de una tarea existente
  // en tu colección 'tasks' (o 'tareas') en Cloud Firestore.
  // Puedes obtener este ID de la consola de Firebase o de la salida de la ejecución
  // de tu script de creación de tareas (testTasks.js).
  const taskIdToUpdate = '3itVKfQ3yzG72KY9HOFc'; // <-- ¡REEMPLAZA ESTO CON UN ID REAL!

  // Si necesitas UIDs para re-asignar tareas, pégalos aquí también:
  // const existingSuperAdminUid = 'PEGA_AQUÍ_EL_UID_REAL_DE_UN_ADMIN';
  // const existingWorkerUid = 'PEGA_AQUÍ_EL_UID_REAL_DE_UN_TRABAJADOR';


  // --- Pruebas de Actualización ---

  if (taskIdToUpdate && taskIdToUpdate !== 'PEGA_AQUÍ_EL_ID_REAL_DE_UNA_TAREA') {

      // Ejemplo 1: Actualizar solo el estado de una tarea
      const updateStatus = {
          status: 'Completada', // Cambiar el estado a 'Completada'
          // Puedes añadir un timestamp de modificación si lo necesitas en tu esquema
          // updatedAt: new Date(),
      };

      console.log(`\n--- Actualizando Tarea ${taskIdToUpdate} (Estado a Completada) ---`);
      const resultUpdateStatus = await updateTask(taskIdToUpdate, updateStatus);
      console.log(`Resultado Actualización Estado: ${resultUpdateStatus.success ? 'Éxito' : resultUpdateStatus.error}`);

      // Ejemplo 2: Actualizar múltiples campos de la misma tarea (ej: asignado y prioridad)
      // **NOTA:** Para este ejemplo, necesitarías tener UIDs de usuarios existentes pegados arriba.
       /*
       const updateAssignedAndPriority = {
           assignedTo: existingSuperAdminUid, // Re-asignar al Admin
           priority: 'Media', // Cambiar prioridad
           // updatedAt: new Date(),
       };

       // Espera un momento si actualizas muy rápido el mismo documento, aunque updateDoc suele manejar esto.
       // await new Promise(resolve => setTimeout(resolve, 500)); // Espera 0.5 segundos

       console.log(`\n--- Actualizando Tarea ${taskIdToUpdate} (Asignado y Prioridad) ---`);
       const resultUpdateAssigned = await updateTask(taskIdToUpdate, updateAssignedAndPriority);
       console.log(`Resultado Actualización Asignado/Prioridad: ${resultUpdateAssigned.success ? 'Éxito' : resultUpdateAssigned.error}`);
       */

        // Puedes añadir más ejemplos de actualización aquí

  } else {
      console.log("\n--- Pruebas de Actualización Omitidas: No se proporcionó un ID de tarea válido para actualizar. ---");
      console.log("Edita el script testTaskUpdates.js y reemplaza 'PEGA_AQUÍ_EL_ID_REAL_DE_UNA_TAREA' con el ID de una tarea existente de tu Firebase.");
  }


  console.log("\n--- Script de prueba de actualización de tareas finalizado ---");

  // Nota: Puedes añadir process.exit() aquí si necesitas forzar la salida
  // después de que todas las operaciones asíncronas hayan terminado.
}

// Ejecuta la función principal de pruebas de actualización de tareas
runTestTaskUpdates();