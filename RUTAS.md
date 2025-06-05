#  Rutas de la API - Proyecto IDS

Este documento describe las rutas disponibles para realizar `fetch` desde el frontend hacia el backend.  
La URL base para todas las peticiones es: https://proyecto-ids.vercel.app/api/

## 👤 `GET /tasks/:uid`

**Descripción**:
Devuelve todas las tareas asignadas a un usuario específico, consultado por su UID. Esta ruta es solo accesible para administradores.

Parámetro en URL:

    uid – UID del usuario

**Headers**
Authorization: Bearer <token_admin>

**Respuesta**:
Un array con las tareas cuyo campo assignedTo coincide con el uid.

```js
fetch("https://proyecto-ids.vercel.app/api/tasks/gxoyKkAMIPMAeeoUHRZjIQhUkH52")
  .then(res => res.json())
  .then(data => console.log(data));

```

## `PUT /reassign-task/:taskId`
**Descripción**:
Reasigna una tarea a otro usuario, validando que quien lo hace sea administrador.

**Parámetro en URL**:
    taskId – ID de la tarea a reasignar

**Headers**:
Authorization: Bearer <token_admin>
Content-type: application/json

**Respuesta**:
Mensaje de éxito si la reasignación fue exitosa(junto con el uid del nuevo usuario asignado) o error si falló alguna validación.

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


    
## `GET /checkAdmin`
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


## `POST /createUser`
**Descripción**:
Permite a un administrador crear un nuevo usuario. El UID para este usuario será generado automáticamente por Firebase Authentication. El RUT del usuario se guardará como un campo adicional dentro del perfil del usuario. El empresaId del nuevo usuario será automáticamente heredado del empresaId del administrador que realiza la creación. Si es el primer usuario de una nueva empresa (es decir, el primer administrador creado sin un padre), se le asignará un nuevo empresaId único.

**Headers requeridos:**:
    Authorization: "Bearer <token>"(si el creador es un admin y se desea heredar el empresaId)

    Content-Type: "application/json"


**Cuerpo del request:**:
    Debe contener los datos del nuevo usuario, excluyendo el UID y el empresaId (ya que este será generado o heredado).

```json
{
  "email": "correo.nuevo@example.com",
  "password": "PasswordSeguro123",
  "rut": "12.345.678-9",
  "name": "Nombre de Usuario",
  "lastName": "Apellido de Usuario",
  "role": "user",
  "isAdmin": false
}

```

**Respuesta**:
Devuelve un mensaje de éxito con los datos del usuario creado, incluyendo el UID generado por Firebase y el empresaId asignado, o un mensaje de error si falló alguna validación o permisos.

**Ejemplo de fetch**:
```js
fetch("[https://proyecto-ids.vercel.app/api/createUser](https://proyecto-ids.vercel.app/api/createUser)", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <token_admin>" // Omitir si es el primer admin (ruta /createUserAUX)
  },
  body: JSON.stringify({
    email: "nuevo.usuario.ejemplo@example.com",
    password: "PasswordSeguro123",
    rut: "12.345.678-9",
    name: "Usuario",
    lastName: "Ejemplo",
    role: "user",
    isAdmin: false
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

**Consideración para la creación del primer administrador:**
Para crear el primer administrador de una nueva empresa (cuando no hay un administrador padre para heredar un empresaId), se puede usar una ruta específica sin autenticación (ej. POST /api/createUserAUX) donde el sistema generará automáticamente un nuevo empresaId para este usuario. Este flujo es típicamente para la inicialización del sistema o un registro de empresa.


## `GET /statustasks/:uid`
**Descripción**:
Devuelve las tareas asignadas a un usuario específico, permitiendo aplicar filtros por estado, prioridad, día o semana.
Tanto el usuario como un administrador pueden consultar esta ruta(el usuario solo puede ver sus propias tareas, el admin puede ver las de cualquiera).


**Parámetro en URL**:
    uid – UID del usuario cuyas tareas se desean consultar.

**Headers requeridos**:
    Authorization: "Bearer <token_del_user_o_admin>"

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
**Descripción:**

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

## `PATCH /tasks/:taskId/status`
**Descripción:**

Permite realizar actualización en el estado de una tarea.

Estados permitidos son `pendiente`, `en progreso` y `completada`.


## `GET /my-pending-tasks`
**Descripción**:
Devuelve las tareas pendientes (status: "pendiente") asignadas al usuario autenticado.
**Headers requeridos:**:
    Authorization: "Bearer <token_usuario_normal_o_admin>"



**Respuesta**:
{
    "tasks": [
        {
            "id": "pending_task_id_1",
            "title": "Mi tarea pendiente",
            "description": "...",
            "assignedTo": "uid_del_token",
            "status": "pendiente",
            "priority": "media",
            "startTime": "...",
            "endTime": "...",
            "createdAt": "..."
        }
    ]
}


## `GET /createTask`
**Descripción**:
Permite a un administrador crear una nueva tarea y asignarla a un usuario.
**Headers**:
Authorization: "Bearer <token_admin>"
Content-Type: application/json

**Cuerpo del request**:
{
    "assignedTo": "UID_del_usuario_receptor",
    "createdBy": "UID_del_admin_creador",
    "description": "Detalles de la tarea a realizar.",
    "startTime": "2025-05-23T09:00:00.000Z", // Formato ISO 8601
    "endTime": "2025-05-23T17:00:00.000Z",   // Formato ISO 8601
    "priority": "normal", // Opciones: "alta", "media", "baja"
    "status": "pendiente", // Opciones: "pendiente", "en progreso", "completada"
    "title": "Título corto de la tarea"
}


  Un array con las tareas completadas hoy. Cada tarea incluye:
    - id: ID de la tarea
    - description: descripción de la tarea
    - status: estado (completada)
    - realStartTime: fecha de inicio real (formato JS Date)
    - realEndTime: fecha de término real (formato JS Date)

   Si el usuario en el parámetro no coincide con el token, se devuelve un error 403.


**Ejemplo de fetch**:

```js
fetch("https://proyecto-ids.vercel.app/api/tasks/done/gxoyKkAMIPMAeeoUHRZjIQhUkH52/today", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`
  }
})

```



## `GET /admin/tasks`
**Descripción**:
Devuelve todas las tareas del sistema filtradas por estado, usuario asignado y/o rango de tiempo (día o semana).
Solo administradores pueden acceder a esta ruta.

**Headers requeridos**:
    Authorization: "Bearer <token>"

### Filtros disponibles (opcionales vía query params)

| Parámetro | Tipo                  | Descripción |
|-----------|-----------------------|-------------|
| `status`  | string                | Filtra por estado de la tarea. Valores válidos: "sin asignar", "pendiente", "en curso", "completada".|
| `userId`| string                | Filtra por ID del usuario asignado (assignedTo). No se aplica si status = "sin asignar".|
| `time`   | string | Filtra tareas según la fecha de inicio (startTime). Valores válidos: "today" o "week". |


> 🔸 **Nota**:El filtro time se aplica si está presente, y limita el rango entre el inicio y fin del día o semana actuales (usando Luxon internamente).

**Respuesta**:
  Devuelve una lista de tareas que cumplen los filtros aplicados.
  donde cada tarea contiene:
  - id, 
  - title, 
  - description, 
  - status, 
  - etc ..


**Ejemplo de fetch**:

```js
const queryParams = new URLSearchParams({
  status: "completada",
  userId: "1234567-8", // Opcional
  time: "today" //Opcional
});

fetch(`https://proyecto-ids.vercel.app/api/admin/tasks?${queryParams.toString()}`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
})
```