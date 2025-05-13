#  Rutas de la API - Proyecto IDS

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


    
## GET /checkAdmin
**Descripción**:
Verifica si el usuario autenticado (según el token JWT enviado) tiene permisos de administrador.

**Headers requeridos:**:
    Authorization: "Bearer <token>"

**Respuesta**:
Devuelve { isAdmin: true } si el usuario es administrador.
Devuelve error 401 o 403 si el token no es válido o si no tiene privilegios.


```js
fetch("https://proyecto-ids.vercel.app/api/checkAdmin", {
  method: "GET",
  headers: {
    "Authorization": "Bearer <token>"
  }
})
.then(res => res.json())
.then(data => console.log(data));
```


## POST /createUser
**Descripción**:
Permite a un administrador crear un nuevo usuario en la base de datos.

**Headers requeridos:**:
    Authorization: "Bearer <token>"


**Cuerpo del request:**:
    Debe contener los datos del nuevo usuario, por ejemplo:

```json
{
  "uid": "12345678-9",
  "name": "Nombre Apellido",
  "email": "correo@example.com",
  "isAdmin": false
}

```

**Respuesta**:
Mensaje de éxito si la creación fue exitosa o error si falló alguna validación o permisos.

**Ejemplo de fetch**:
```js
fetch("https://proyecto-ids.vercel.app/api/createUser", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <token>"
  },
  body: JSON.stringify({
    uid: "12345678-9",
    name: "Nombre Apellido",
    email: "correo@example.com",
    isAdmin: false
  })
})
.then(res => res.json())
.then(data => console.log(data));
```


## GET /statustasks/:userId
**Descripción**:
Devuelve las tareas asignadas a un usuario específico, permitiendo aplicar filtros por estado, prioridad, día o semana.
Tanto el usuario como un administrador pueden consultar esta ruta.


**Parámetro en URL**:
    userId – UID del usuario cuyas tareas se desean consultar.

**Headers requeridos**:
    Authorization: "Bearer <token>"

### Filtros disponibles (opcionales vía query params)

| Parámetro | Tipo                  | Descripción |
|-----------|-----------------------|-------------|
| `status`  | string                | Filtra por estado de la tarea (por ejemplo: `"pendiente"`, `"completada"`). |
| `priority`| string                | Filtra por prioridad (por ejemplo: `"alta"`, `"media"`, `"baja"`). |
| `today`   | boolean (como string) | Si es `"true"`, filtra las tareas que tienen `startTime` en el día actual. |
| `week`    | boolean (como string) | Si es `"true"`, filtra las tareas programadas en la semana actual (lunes a domingo). |


> 🔸 **Nota**: Los filtros `today` y `week` son **excluyentes** entre sí. Si ambos están presentes, se evalúan en el orden del backend.

**Respuesta**:
  Devuelve un objeto con:

  - Información del usuario (id, name, lastName)

  - Conteo de tareas (count)

  - Lista de tareas (tasks), cada una con:

    - id, title, description, status, priority

    - startTime, endTime, createdAt (como fechas JS)

**Ejemplo de fetch**:

```js
const queryParams = new URLSearchParams({
  status: "pendiente",
  priority: "alta",
  today: "true"
});

fetch(`https://proyecto-ids.vercel.app/api/statustasks/${userId}?${queryParams.toString()}`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
})
```

## `POST /createTask`
**Descripcion:**

Crea una tarea con el siguiente formato (JSON):
```
{
"assignedTo": "",
"createdBy": "",
"description": "",
"startTime": "",
"endTime": "",
"priority": "",
"status": "",
"title": ""
}
```
