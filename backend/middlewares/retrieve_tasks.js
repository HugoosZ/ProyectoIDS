// backend/middlewares/retrieve_tasks.js
const { db } = require("../firebase"); // Asegúrate de que importas 'db' de firebase.js
const { Timestamp } = require("firebase-admin/firestore"); // Para manejar fechas de Firestore
const { getDateRange } = require("../utils/dateFilters"); // Asegúrate de que esta utilidad exista y funcione.

exports.getUserTaskStatus = async (req, res) => {
  try {
    const { userId } = req.params; // UID del usuario cuyas tareas se quieren ver (el de la URL)

    // Datos del usuario que hace la petición (vienen del token, inyectados por authentication.js)
    const requestingUserId = req.user.uid;
    const requestingUserEmpresaId = req.user.empresaId;
    const requestingUserIsAdmin = req.user.isAdmin;

    // --- DEBUG LOGS INICIO ---
    console.log(
      "********** DEBUG retrieve_tasks.getUserTaskStatus - Inicio Petición **********"
    );
    console.log("UID solicitado en URL (`:userId`):", userId);
    console.log(
      "UID del usuario que solicita (desde token - `req.user.uid`):",
      requestingUserId
    );
    console.log(
      "EmpresaId del usuario que solicita (desde token - `req.user.empresaId`):",
      requestingUserEmpresaId
    );
    console.log("¿Es Admin el usuario que solicita?:", requestingUserIsAdmin);
    // --- DEBUG LOGS FIN ---

    // 1. Obtener los datos del usuario solicitado (el del `:userId` en la URL)
    const requestedUserDoc = await db.collection("users").doc(userId).get();
    if (!requestedUserDoc.exists) {
      console.log(
        "DEBUG: Usuario solicitado NO encontrado en Firestore:",
        userId
      );
      return res
        .status(404)
        .json({ error: "Usuario solicitado no encontrado." });
    }
    const requestedUserEmpresaId = requestedUserDoc.data().empresaId; // EmpresaId del usuario solicitado
    console.log(
      "DEBUG: EmpresaId del usuario solicitado (desde Firestore):",
      requestedUserEmpresaId
    );

    // 2. Lógica de permisos (combinando la tuya con la base de tu compañero)
    // Un usuario NO admin solo puede ver sus propias tareas y debe estar en la misma empresa.
    if (!requestingUserIsAdmin) {
      if (userId !== requestingUserId) {
        console.log(
          "DEBUG: Acceso denegado - Usuario NO admin intentó ver tareas de OTRO usuario."
        );
        return res
          .status(403)
          .json({
            error:
              "No autorizado: Un usuario regular solo puede ver sus propias tareas.",
          });
      }
      // Si es el propio usuario, también debe verificar que su empresaId coincide con el solicitado
      if (requestingUserEmpresaId !== requestedUserEmpresaId) {
        console.log(
          "DEBUG: Acceso denegado - Usuario intentó ver sus propias tareas pero la empresaId no coincide (anomalía)."
        );
        return res
          .status(403)
          .json({ error: "No autorizado: Discrepancia en empresa." });
      }
    } else {
      // Si es un admin, puede ver tareas de cualquier usuario de SU MISMA EMPRESA.
      if (requestingUserEmpresaId !== requestedUserEmpresaId) {
        console.log(
          `DEBUG: Acceso denegado - Admin de empresa [<span class="math-inline">\{requestingUserEmpresaId\}\] intentó ver tareas de usuario de OTRA empresa \[</span>{requestedUserEmpresaId}].`
        );
        return res
          .status(403)
          .json({
            error:
              "Acceso denegado: El administrador no puede ver tareas de otras empresas.",
          });
      }
      console.log(
        `DEBUG: Admin de empresa [<span class="math-inline">\{requestingUserEmpresaId\}\] tiene permiso para ver tareas del usuario \[</span>{userId}] de su misma empresa.`
      );
    }

    // 3. Construir la consulta a Firestore para obtener las tareas
    // La consulta siempre debe filtrar por el assignedTo (el uid de la URL)
    // y por el empresaId del usuario solicitado
    let tasksQuery = db
      .collection("tasks")
      .where("assignedTo", "==", userId)
      .where("empresaId", "==", requestedUserEmpresaId); // Filtro crucial por empresaId

    // 4. Aplicar filtros opcionales (status, priority, today, week)
    const { status, priority, today, week } = req.query;

    if (status) {
      tasksQuery = tasksQuery.where("status", "==", status);
      console.log("DEBUG: Filtro por status:", status);
    }
    if (priority) {
      tasksQuery = tasksQuery.where("priority", "==", priority);
      console.log("DEBUG: Filtro por priority:", priority);
    }

    // Considerar "today" y "week" mutuamente excluyentes (se usa else if)
    if (today === "true") {
      const { startDate, endDate } = getDateRange("today");
      tasksQuery = tasksQuery
        .where("startTime", ">=", startDate)
        .where("startTime", "<=", endDate);
      console.log(
        `DEBUG: Filtro por tareas de HOY (startTime entre ${startDate.toDate()} y ${endDate.toDate()}).`
      );
    } else if (week === "true") {
      const { startDate, endDate } = getDateRange("week");
      tasksQuery = tasksQuery
        .where("startTime", ">=", startDate)
        .where("startTime", "<", endDate); // Usar < para semana completa
      console.log(
        `DEBUG: Filtro por tareas de la SEMANA (startTime entre ${startDate.toDate()} y ${endDate.toDate()}).`
      );
    }

    // 5. Ordenar los resultados
    tasksQuery = tasksQuery.orderBy("createdAt", "desc");

    // 6. Ejecutar la consulta
    const snapshot = await tasksQuery.get();

    // 7. Formatear la respuesta
    const tasks = snapshot.docs.map((doc) => {
      const taskData = doc.data();
      return {
        id: doc.id,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        startTime: taskData.startTime?.toDate() || null,
        endTime: taskData.endTime?.toDate() || null,
        createdAt: taskData.createdAt.toDate(),
        empresaId: taskData.empresaId, // Incluir para depuración si es necesario
      };
    });

    console.log(
      `DEBUG: <span class="math-inline">\{tasks\.length\} tareas encontradas para el usuario \[</span>{userId}].`
    );
    console.log(
      "********** DEBUG retrieve_tasks.getUserTaskStatus - Fin Petición Exitosa **********"
    );

    res.status(200).json({
      user: {
        id: userId,
        name: requestedUserDoc.data().name,
        lastName: requestedUserDoc.data().lastName,
        empresaId: requestedUserDoc.data().empresaId, // Incluir el empresaId del usuario solicitado
      },
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error(
      "********** DEBUG retrieve_tasks.getUserTaskStatus - Error en la petición **********"
    );
    console.error("Error al obtener tareas (getUserTaskStatus):", error);

    if (error.code === "failed-precondition") {
      console.error(
        "DEBUG: Posible error de índice en Firestore. Verifique la consola de Firebase. URL del índice sugerido por Firebase."
      );
      return res.status(400).json({
        error:
          "Error en la consulta de base de datos. Asegúrate de tener los índices necesarios en Firestore.",
        details: error.message,
      });
    }
    if (error.code === "PERMISSION_DENIED") {
      console.error(
        "DEBUG: Error de PERMISOS de Firestore. Revise sus reglas de seguridad. Puede que sus reglas estén bloqueando esta consulta."
      );
      return res.status(403).json({
        error: "Error de permisos en la base de datos.",
        details: error.message,
      });
    }
    if (error.code === 3) {
      // Este es un error común de Firestore para consultas inválidas
      return res
        .status(400)
        .json({
          error: "Parámetros de consulta inválidos.",
          details: error.message,
        });
    }

    res.status(500).json({
      error: "Error interno del servidor al obtener tareas.",
      details: error.message,
    });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const snapshot = await db.collection("tasks").get();
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ error: "Error al obtener tareas" });
  }
};

exports.getUserTasks = async (req, res) => {
  const { userId } = req.params;
  try {
    const snapshot = await db
      .collection("tasks")
      .where("assignedTo", "==", userId)
      .get();
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ error: "Error al obtener tareas" });
  }
};
