const { db } = require("../firebase");
const { Timestamp } = require("firebase-admin/firestore");
const { getDateRange } = require("../utils/dateFilters"); // OK

exports.createTask = async (req, res) => { // OK
  try {
    const {
      assignedTo,
      description,
      startTime,
      endTime,
      priority,
      status,
      title,
    } = req.body;
        const createdBy = req.user.uid;
        const creatorEmpresaId = req.user.empresaId; 
    // Validate required fields
    if (
      !description ||
      !title ||
      !createdBy ||
      !assignedTo ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const assignedUserDoc = await db.collection("users").doc(assignedTo).get();
    if (!assignedUserDoc.exists) {
      return res.status(404).json({ message: "Assigned user not found" });
    }
  const assignedUserEmpresaId = assignedUserDoc.data().empresaId;

    if (assignedUserEmpresaId !== creatorEmpresaId) {
      return res.status(403).json({ message: "No autorizado: No se puede asignar tareas a usuarios de otra empresa." });
    }
    const newTask = {
      assignedTo,
      createdAt: Timestamp.now(),
      createdBy,
      description,
      endTime: Timestamp.fromDate(new Date(endTime)),
      priority: priority || "normal",
      startTime: Timestamp.fromDate(new Date(startTime)),
      status: status || "pending",
      title,
      empresaId: creatorEmpresaId,
      realStartTime: null,
      realEndTime: null
    };

    const docRef = await db.collection("tasks").add(newTask);

    return res.status(201).json({ id: docRef.id, ...newTask });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
