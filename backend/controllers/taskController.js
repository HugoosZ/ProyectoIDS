const { db } = require("../firebase");
const { Timestamp } = require("firebase-admin/firestore");
const { getDateRange } = require("../utils/dateFilters"); // OK

exports.createTask = async (req, res) => {
  try {
    const createdByUid = req.user.uid;
    //const createdByEmpresaId = req.user.empresaId;
    const {
      assignedTo,
      description,
      startTime,
      endTime,
      priority,
      status,
      title,
    } = req.body; // Validate required fields

    if (
      !description ||
      !title ||
      !assignedTo ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Verificar si el usuario 'assignedTo' existe
    const assignedUserDoc = await db.collection('users').doc(assignedTo).get();
    if (!assignedUserDoc.exists) {
        return res.status(404).json({ message: `Assigned user with UID '${assignedTo}' not found.` });
    }
    
    // 2. Verificar que el usuario 'assignedTo' pertenezca a la misma empresa que el administrador
/*     const assignedUserEmpresaId = assignedUserDoc.data().empresaId;
    if (assignedUserEmpresaId !== createdByEmpresaId) {
        return res.status(403).json({ message: "No autorizado: No puede asignar tareas a usuarios de otras empresas" });
    } */

    const newTask = {
      assignedTo,
      createdAt: Timestamp.now(),
      createdBy: createdByUid,
      description,
      endTime: Timestamp.fromDate(new Date(endTime)),
      priority: priority || "normal",
      startTime: Timestamp.fromDate(new Date(startTime)),
      status: status || "pending",
      title,
      realStartTime: null,
      realEndTime: null,
      //empresaId: createdByEmpresaId,
    };

    const docRef = await db.collection("tasks").add(newTask);

    return res.status(201).json({ id: docRef.id, ...newTask });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
