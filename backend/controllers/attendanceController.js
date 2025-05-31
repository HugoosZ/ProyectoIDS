/* Historia de Usuario: Como usuario, quiero registrar mi entrada y salida laboral fácilmente para evidenciar mi asistencia. 
El sistema debe registrar la fecha y hora del ingreso y salida.  */
const { db } = require("../firebase");

exports.checkIn = async (req, res) => {
  const { userId } = req.params;
  try {
    const uid = userId;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    //const now = new Date().toISOString();
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(now);

    const docId = `${uid}_${today}`;
    const docRef = db.collection("asistencias").doc(docId);

    // Revisar si el usuario ya se encuentra presente en el checkIn
    const existingDoc = await docRef.get();

    // Si ya esta dentro del chechIn no es posible hacerlo denuevo
    if (existingDoc.exists && existingDoc.data().isPresent == true) {
      return res.status(400).json({
        error: "Ya se ha registrado una entrada.",
      });
    }

    await docRef.set({
      userId: uid,
      date: today,
      checkIn: formatted,
      isPresent: true,
    });

    res.status(200).json({
      message: "Entrada registrada correctamente.",
      checkIn: formatted,
    });
  } catch (err) {
    res.status(500).json({
      error: "Error al registrar entrada.",
      details: err.message,
    });
  }
};

exports.checkOut = async (req, res) => {
  const { userId } = req.params;
  try {
    const uid = userId;
    const today = new Date().toISOString().split("T")[0];
    //const now = new Date().toISOString();
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(now);

    const docId = `${uid}_${today}`;
    const docRef = db.collection("asistencias").doc(docId);
    const existingDoc = await docRef.get();

    // Si el usuario ya hizo checkOut no es posible hacerlo denuevo
    if (!existingDoc.exists || !existingDoc.data().checkIn) {
      return res.status(400).json({
        error: "No se puede registrar salida sin haber registrado entrada.",
      });
    }

    if (existingDoc.data().isPresent == false) {
      return res.status(400).json({
        error: "Ya se ha registrado una salida.",
      });
    }

    await docRef.update({
      checkOut: formatted,
      date: today,
      isPresent: false,
    });

    res.status(200).json({
      message: "Salida registrada correctamente.",
      checkOut: formatted,
    });
  } catch (err) {
    res.status(500).json({
      error: "Error al registrar salida.",
      details: err.message,
    });
  }
};
