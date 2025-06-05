/* Historia de Usuario: Como usuario, quiero registrar mi entrada y salida laboral fácilmente para evidenciar mi asistencia. 
El sistema debe registrar la fecha y hora del ingreso y salida.  */
const { db } = require("../firebase");

exports.checkIn = async (req, res) => {
  const { userId } = req.params;
  try {
    const uid = userId;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const now = new Date().toISOString();

    const docId = `${uid}_${today}`;
    const docRef = db.collection("asistencias").doc(docId);

    await docRef.set({
      userId: uid,
      date: today,
      checkIn: now,
    });

    res
      .status(200)
      .json({ message: "Entrada registrada correctamente", checkIn: now });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al registrar entrada", details: err.message });
  }
};

exports.checkOut = async (req, res) => {
  const { userId } = req.params;
  try {
    const uid = userId;
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();

    const docId = `${uid}_${today}`;
    const docRef = db.collection("asistencias").doc(docId);

    await docRef.update({
      checkOut: now,
    });

    res
      .status(200)
      .json({ message: "Salida registrada correctamente", checkOut: now });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al registrar salida", details: err.message });
  }
};
