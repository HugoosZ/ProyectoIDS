#  Rutas de la API - Proyecto IDS

Este documento describe las rutas disponibles para realizar `fetch` desde el frontend hacia el backend.  
La URL base para todas las peticiones es: https://proyecto-ids.vercel.app/api/

## 📝 `GET /api/users`
**Descripción**:
Permite a un usuario autenticado con rol de `admin` obtener la lista de todos los usuarios registrados **dentro de su propia empresa**. La respuesta se filtra automáticamente por el `empresaId` del administrador que realiza la solicitud, garantizando la seguridad y la visibilidad de datos solo dentro de la empresa.

**Headers**:
Authorization: "Bearer <token_admin>"
Content-Type: application/json

**Cuerpo del request**:
No aplica (GET request).

**Parámetros de Ruta (URL Parameters)**:
No aplica.

**Respuestas Posibles**:

* **`200 OK`**: Retorna un array de objetos de usuario de la misma empresa del administrador.
    ```json
    [
        {
            "id": "userUID1",
            "name": "Juan",
            "lastName": "Perez",
            "email": "juan.perez@empresaA.com",
            "isAdmin": false,
            "empresaId": "empresa_A"
            // Otros campos relevantes del usuario, excepto sensibles como contraseñas
        },
        {
            "id": "userUID2",
            "name": "Maria",
            "lastName": "Gonzalez",
            "email": "maria.gonzalez@empresaA.com",
            "isAdmin": true,
            "empresaId": "empresa_A"
        }
    ]
    ```
    * Si no hay usuarios en la empresa del administrador, devuelve un array vacío: `[]`

* **`401 Unauthorized`**: Si el token JWT no es válido o está ausente.
    ```json
    {
        "message": "Unauthorized: Invalid or missing token."
    }
    ```

* **`403 Forbidden`**: Si el usuario autenticado no tiene rol de `admin` o no está asociado a una empresa.
    ```json
    {
        "error": "Se requiere rol admin"
    }
    ```
    ```json
    {
        "message": "Forbidden: Admin user is not associated with an enterprise."
    }
    ```

* **`500 Internal Server Error`**: Si ocurre un error inesperado en el servidor.
    ```json
    {
        "error": "Error interno del servidor al obtener usuarios",
        "details": "Mensaje de error técnico"
    }
    ```

**Ejemplo de fetch**:

```javascript
const token = '<TOKEN_DE_ADMIN_EMPRESA_A>'; // Reemplaza con un token JWT válido de un administrador

fetch("[https://proyecto-ids.vercel.app/api/users](https://proyecto-ids.vercel.app/api/users)", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## 📝 `GET /tasks`

**Descripción:**
Devuelve todas las tareas que pertenecen a la misma empresa del usuario autenticado. Esta ruta permite a usuarios y administradores obtener una vista general de las actividades dentro de su propia organización.

**Roles requeridos:** `Usuario` o `Administrador`.

**Método:** `GET`

**URL:** `/api/tasks`

**Headers:**
* `Authorization`: `Bearer <token_del_usuario_autenticado>`
* `Content-Type`: `application/json` (opcional para GET)

**Ejemplo de Solicitud (desde el cliente):**
```javascript
fetch("[https://proyecto-ids.vercel.app/api/tasks](https://proyecto-ids.vercel.app/api/tasks)", {
  headers: {
    'Authorization': 'Bearer <token_de_mi_usuario>'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```
## 📝 `GET /tasks/:userId`

**Descripción:**
Devuelve todas las tareas asignadas a un usuario específico, consultado por su UID.
Esta ruta aplica las siguientes reglas de autorización:
* Un **usuario normal** solo puede consultar sus *propias* tareas (es decir, el `:userId` en la URL debe coincidir con su propio UID autenticado).
* Un **administrador** puede consultar las tareas de *cualquier* usuario, **siempre y cuando ese usuario pertenezca a la misma empresa** que el administrador.

**Roles requeridos:** `Usuario` o `Administrador` (con las restricciones mencionadas).

**Método:** `GET`

**URL:** `/api/tasks/:userId`

**Parámetros de URL:**
* `userId` (string): UID del usuario cuyas tareas se desean consultar.

**Headers:**
* `Authorization`: `Bearer <token_del_usuario_autenticado>`
* `Content-Type`: `application/json` (aunque no es estrictamente necesario para GET)

**Ejemplo de Solicitud (desde el cliente):**
```javascript
// Para un usuario normal viendo sus propias tareas
fetch("[https://proyecto-ids.vercel.app/api/tasks/UID_DE_MI_PROPIO_USUARIO](https://proyecto-ids.vercel.app/api/tasks/UID_DE_MI_PROPIO_USUARIO)", {
  headers: {
    'Authorization': 'Bearer <token_de_mi_propio_usuario>'
  }
})
.then(res => res.json())
.then(data => console.log(data));

// Para un administrador viendo tareas de un usuario de su misma empresa
fetch("[https://proyecto-ids.vercel.app/api/tasks/UID_DE_USUARIO_DE_MISMA_EMPRESA](https://proyecto-ids.vercel.app/api/tasks/UID_DE_USUARIO_DE_MISMA_EMPRESA)", {
  headers: {
    'Authorization': 'Bearer <token_del_administrador>'
  }
})
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

## Notas importantes sobre el cuerpo de la solicitud:##
Los campos createdBy y empresaId no deben ser enviados en el cuerpo de la solicitud. Estos valores se obtienen automáticamente del token del administrador autenticado (req.user) para garantizar la seguridad y la correcta asociación.
Los campos createdAt, realStartTime y realEndTime también se gestionan automáticamente por el servidor.

## `PATCH /api/tasks/:taskId/status`
**Descripción**:
Permite a un usuario autenticado actualizar el estado de una tarea específica por su ID. La operación está restringida:
* Un **usuario normal** solo puede actualizar el estado de las tareas que le están **asignadas**.
* Un **administrador** puede actualizar el estado de cualquier tarea **dentro de su misma empresa**.
* Cuando el estado cambia a `"en progreso"`, se registra `realStartTime` si no está ya establecido.
* Cuando el estado cambia a `"completada"`, se registra `realEndTime` si no está ya establecido y se descuenta 1 de `currentTasks` en el registro de asistencia del usuario asignado.

**Headers**:
Authorization: "Bearer <token>"
Content-Type: application/json

**Cuerpo del request**:
```json
{
    "status": "completada" // "pendiente", "en progreso"
}
```

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


## `POST /api/createTask`

**Descripción**: Permite a un administrador crear una nueva tarea y asignarla a uno o **múltiples usuarios**. La tarea creada heredará automáticamente el `empresaId` del administrador que la está creando, asegurando que la tarea pertenezca a la misma empresa del creador. Se realizan validaciones estrictas para asegurar la correcta asignación, incluyendo la verificación de la existencia del usuario, pertenencia a la misma empresa, estado de actividad laboral (check-in), y solapamiento de horarios con tareas existentes.

**Headers**:
- `Authorization`: "Bearer <token_admin>"
- `Content-Type`: `application/json`

**Cuerpo del Request**:
```json
{
    "assignedTo": ["UID_del_usuario_1", "UID_del_usuario_2", "UID_del_usuario_N"],
    "description": "Detalles completos y claros de la tarea a realizar, incluyendo cualquier información relevante para su ejecución.",
    "startTime": "2025-05-30T09:00:00.000Z", // Formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
    "endTime": "2025-05-30T10:00:00.000Z",   // Formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
    "priority": "normal", // Opciones válidas: "alta", "media", "baja". Si no se especifica, el valor por defecto es "normal".
    "status": "pendiente", // Opciones válidas: "pendiente", "en progreso", "completada". Si no se especifica, el valor por defecto es "pendiente".
    "title": "Título corto y descriptivo de la tarea."
}



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

## `GET /admin/workers/isPresent/NoTasks`
**Descripción**:
Devuelve una lista de trabajadores presentes(De momento desactivado) que no tienen tareas asignadas actualmente (currentTasks === 0).
Esta ruta solo puede ser accedida por administradores.

**Headers requeridos**:
    Authorization: "Bearer <token>"

**Respuesta**:
Una lista de objetos que contienen información de la tabla asistencia y los datos básicos del usuario asociado (nombre y correo electrónico).

```
  {
    "asistenciaId": "ID_DEL_DOCUMENTO_ASISTENCIA",
    "isPresent": true,
    "currentTasks": 0,
    "userId": "UID_DEL_USUARIO",
    "user": {
      "name": "Nombre del Usuario",
      "email": "correo@example.com"
  }
```




**Ejemplo de fetch**:

```js
fetch("https://proyecto-ids.vercel.app/api/admin/workers/isPresent/NoTasks", {
  method: "GET",
  headers: {
    "Authorization": "Bearer <token_del_admin>"
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

## `GET /admin/attendance`
**Descripción**:
Permite a un administrador obtener los registros de asistencia de todos los usuarios, de un usuario específico, o filtrar por presencia/ausencia. Devuelve información de la asistencia junto con los datos básicos del usuario asociado (nombre y correo electrónico).

**Roles requeridos:** Administrador (token JWT válido y privilegios de admin).

**Headers requeridos:**
    Authorization: "Bearer <token_admin>"
    Content-Type: "application/json" (opcional para GET)

**Parámetros de consulta (query params) opcionales:**
| Parámetro  | Tipo    | Descripción                                                                 |
|------------|---------|-----------------------------------------------------------------------------|
| userId     | string  | Filtra por el UID del usuario.                                               |
| isPresent  | string  | "true" para solo presentes, "false" para solo ausentes.                      |

**Respuesta:**
- 200 OK: Devuelve un array de objetos de asistencia, cada uno con los datos de asistencia y los datos básicos del usuario asociado.
- 404: Si no se encuentra asistencia con los filtros dados.
- 401/403: Si el token es inválido o el usuario no es admin.
- 500: Error interno del servidor.

**Ejemplo de respuesta:**
```json
[
  {
    "asistenciaId": "ID_DEL_DOCUMENTO_ASISTENCIA",
    "userId": "UID_DEL_USUARIO",
    "isPresent": true,
    "currentTasks": 0,
    "horaEntrada": "2025-05-29T08:00:00.000Z",
    "horaSalida": null,
    "user": {
      "name": "Nombre del Usuario",
      "email": "correo@example.com"
    }
  }
]
```

**Ejemplo de fetch:**
```js
const queryParams = new URLSearchParams({
  userId: "UID_DEL_USUARIO", // Opcional
  isPresent: "true" // Opcional: "true" o "false"
});

fetch(`https://proyecto-ids.vercel.app/api/admin/attendance?${queryParams.toString()}`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`
  }
})
  .then(res => res.json())
  .then(data => console.log(data));
```