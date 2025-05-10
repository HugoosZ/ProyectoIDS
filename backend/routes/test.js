
const express = require('express');
const router = express.Router();  // Usa el Router de express directamente
const { auth, db } = require('../firebase');

router.get('/test', (req, res) => {
    res.send("Ruta de prueba funcionando");
});

(async () => {
    const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5MWYxNWRlZTg0OTUzNjZjOTgyZTA1MTMzYmNhOGYyNDg5ZWFjNzIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGFza3ktNjliNzQiLCJhdWQiOiJ0YXNreS02OWI3NCIsImF1dGhfdGltZSI6MTc0NjkwMTEyNiwidXNlcl9pZCI6IjIxMzMzODYzLTMiLCJzdWIiOiIyMTMzMzg2My0zIiwiaWF0IjoxNzQ2OTAxMTI2LCJleHAiOjE3NDY5MDQ3MjYsImVtYWlsIjoicHJ1ZWJhQHBhZHJlaHVnb2Fob3Jhc2kuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbInBydWViYUBwYWRyZWh1Z29haG9yYXNpLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.foZBZ82Lxn-4If_fS5lzk-_ol9BrKMtUu50eA5lzxAwyBiTdKCnVKN9TPqwx3-Nrxa2xyY6FRsXTFscTTWUObDJB7KyKREl4Y-2gsPXaxVs7ChSte73esADSDM221Qq0hnyczosycSCfFzpKDg3SYX1zJXf5IoS68Vlno1bnsxWvYUabTDqGNM3UfDvBDzZtRMDcTj2L7L26OqSZEEKqR7g3UKumzHMK2KbJ0ygCQJL9MbRKe8PHB0AsxOHQ8BNhdbp-j6OIdfby_E_tBGYlBjPk2OC-p6_GhPNghaZzU7NMTSVzckkujQhDtXB6-ZWkfB1AMZW1nR22PBI5Ny6xqA';

    try {
        const decoded = await auth.verifyIdToken(token); // ✅ Aquí corregido

        const userDoc = await db.collection('users').doc(decoded.uid).get(); // Usa Firestore

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