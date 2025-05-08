# 📡 Rutas de la API - Proyecto IDS

Este documento describe las rutas disponibles para realizar `fetch` desde el frontend hacia el backend.  
La URL base para todas las peticiones es: https://proyecto-ids.vercel.app/api/

## 👤 `GET /tasks/:userId`

**Descripción**:
Devuelve todas las tareas asignadas a un usuario específico.

Parámetro en URL:

    userId – UID del usuario

**Respuesta**:
Un array con las tareas cuyo campo assignedTo coincide con el userId.

```js
fetch("https://proyecto-ids.vercel.app/api/tasks/gxoyKkAMIPMAeeoUHRZjIQhUkH52")
  .then(res => res.json())
  .then(data => console.log(data));

```

## PUT /reassign-task/:taskId
**Descripción**:
Reasigna una tarea a otro usuario, validando que quien lo hace sea administrador.

**Parámetro en URL**:
    taskId – ID de la tarea a reasignar

**Respuesta**:
Mensaje de éxito si la reasignación fue exitosa o error si falló alguna validación.

```js
fetch("https://proyecto-ids.vercel.app/api/reassign-task/pBxZsNAPlEakYecJ022U", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    newAssignedToUid: "nuevoUID",
    adminUid: "adminUID"
  })
})
.then(res => res.json())
.then(data => console.log(data));


```
## ✨ Notas adicionales:

    Los UIDs de usuarios se obtienen desde la colección users.

    Las fechas (startTime, endTime, createdAt) son objetos Firestore Timestamp.