
const express = require('express');
const router = express.Router();  // Usa el Router de express directamente
const { auth, db } = require('../firebase');

router.get('/test', (req, res) => {
    res.send("Ruta de prueba funcionando");
});

(async () => {
    const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5MWYxNWRlZTg0OTUzNjZjOTgyZTA1MTMzYmNhOGYyNDg5ZWFjNzIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGFza3ktNjliNzQiLCJhdWQiOiJ0YXNreS02OWI3NCIsImF1dGhfdGltZSI6MTc0Njc1OTY1NCwidXNlcl9pZCI6IjIxMzMzODYzLTMiLCJzdWIiOiIyMTMzMzg2My0zIiwiaWF0IjoxNzQ2NzU5NjU0LCJleHAiOjE3NDY3NjMyNTQsImVtYWlsIjoicHJ1ZWJhQHBhZHJlaHVnb2Fob3Jhc2kuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbInBydWViYUBwYWRyZWh1Z29haG9yYXNpLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.bKrxPpNNEv_VZLtDkbj6P-UMc97TQYCG4BZQ-ftFi5-o2AQYvCApfCoaw4kUjxJl1q1zn8IPrv3x8WoEy4Hg8onYipWSb7uIj-ZR-ElU-M88a7mviR_AT7M5hPwsTtPanASj2hyjEDLBsTzdzeYu2tbI23nQmqokNoGAcGwyc_bFwmb-SOnQ_ZHT9R5ey5ZLwoeh1JK8ABPq9JiRzlk9i2fVTp-2gl_s_PhvLldqmBC48oZzS31uRUs-lXeZTOcF2WV3_Io0sdnNB741EmouiQbKSG-UVV9lEZbQLy_7v5QiiSbbhxf_OEncNbfkdN7tXvyJpRFTNXGwuda0aHj5Lw';

    try {
        const decoded = await auth.verifyIdToken(token); // ✅ Aquí corregido

        const userDoc = await db.collection('usuarios').doc(decoded.uid).get(); // Usa Firestore

        if (!userDoc.exists) {
            console.log('Usuario no encontrado en Firestore');
            return;
        }

        const userData = userDoc.data();

        console.log({
            uid: decoded.uid,
            isAdmin: userData.isAdmin || false,
        });
    } catch (error) {
        console.error('Error verificando token:', error);
    }
})();module.exports = router;