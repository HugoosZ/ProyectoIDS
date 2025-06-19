#  Rutas de la API - Proyecto IDS

Este documento describe las rutas disponibles para realizar `fetch` desde el frontend hacia el backend.  
La URL base para todas las peticiones es: https://proyecto-ids.vercel.app/api/

## 📝 `GET /admin/tasks/detailed`

**Descripción:**
Devuelve una vista detallada de todas las tareas (información principal y sus asignaciones individuales) que pertenecen a la misma empresa del administrador autenticado. Incluye los datos desencriptados de los usuarios participantes en cada asignación. Esta ruta está diseñada exclusivamente para administradores que necesitan una visión completa y desglosada de todas las actividades de su organización.



**Roles requeridos:** `Administrador`.

**Método:** `GET`

**URL:** `/api/tasks`

**Headers:**
* `Authorization`: `Bearer <token_del_administrador_autenticado>`
* `Content-Type`: `application/json` (opcional para GET)

**Ejemplo de Respuesta:**
```json
[
  {
    "id": "MPYKDlSepXGG9nKETe9J",
    "taskId": "5GVjEf9Uw28lDp27QdAt",
    "startTime": "2025-06-17T13:21:00.000Z",
    "endTime": "2025-06-29T15:10:00.000Z",
    "priority": "media",
    "status": "pendiente",
    "requiereRelevo": true,
    "isGroupTask": false,
    "isFinished": false,
    "participants": [
      "ccdc3d942fde8068118ea018:7274dc7891a2cc44a0f65ee1fe05a4c0:366aaf96d88e6358cb6f",
      "a7f5ecc85c5ade8ad8df6215:ac0cccfcf19aec312d4df225703f80ec:541b4d20cecfa8473804"
    ],
    "shouldBeWorking": null,
    "currentlyWorking": null,
    "assignedBy": "64b5f870a4a5f3d8c8950c36:72789c773403625c2b2fef2fd2552ed1:e6da947fc9b821058faf",
    "empresaId": "febfd333-b692-4243-a822-48fbde752da8",
    "createdAt": "2025-06-17T22:50:26.597Z",
    "codigoRelevo": "688289",
    "relevoExpira": "2025-06-18T19:55:29.874Z",
    "validadoRelevo": true,
    "assignments": [
      {
        "id": "2U2gzDgAw8ph417V7hsW",
        "taskInfoId": "MPYKDlSepXGG9nKETe9J",
        "assignedTo": "a7f5ecc85c5ade8ad8df6215:ac0cccfcf19aec312d4df225703f80ec:541b4d20cecfa8473804",
        "startTimeIndividualTask": "2025-06-28T13:12:00.000Z",
        "endTimeIndividualTask": "2025-06-29T13:10:00.000Z",
        "priority": "media",
        "requiereRelevo": true,
        "individualTask": "Pruebas a los sistemas implementados",
        "isGroupTask": false,
        "createdAt": "2025-06-17T22:50:29.312Z",
        "status": "finalizada",
        "assignedToUser": {
          "uid": "a7f5ecc85c5ade8ad8df6215:ac0cccfcf19aec312d4df225703f80ec:541b4d20cecfa8473804",
          "email": "sofia.vergara@mail.com",
          "role": "user",
          "isAdmin": false,
          "empresaId": "b969c0ae-ad7d-4894-ab9b-9fc1148dde14",
          "createdAt": "2025-06-17T22:48:56.029Z",
          "name": "Sofia",
          "lastName": "Vergara",
          "rut": "20835148-6"
        }
      },
      {
        "id": "Tlbb3iBhwF9kWyxMRRhc",
        "taskInfoId": "MPYKDlSepXGG9nKETe9J",
        "assignedTo": "ccdc3d942fde8068118ea018:7274dc7891a2cc44a0f65ee1fe05a4c0:366aaf96d88e6358cb6f",
        "startTimeIndividualTask": "2025-06-18T13:10:00.000Z",
        "endTimeIndividualTask": "2025-06-27T13:10:00.000Z",
        "priority": "media",
        "requiereRelevo": true,
        "individualTask": "Implementaciones iniciales",
        "isGroupTask": false,
        "createdAt": "2025-06-17T22:50:28.743Z",
        "status": "en curso",
        "assignedToUser": {
          "uid": "ccdc3d942fde8068118ea018:7274dc7891a2cc44a0f65ee1fe05a4c0:366aaf96d88e6358cb6f",
          "email": "paula.ovalle@mail.com",
          "role": "user",
          "isAdmin": false,
          "empresaId": "f4141d39-d1a0-4ed6-8c55-ec33151ea7b7",
          "createdAt": "2025-06-17T22:48:02.194Z",
          "name": "Paula",
          "lastName": "Ovalle",
          "rut": "21333082-9"
        }
      }
    ]
  },
  {
    "id": "udy7SweJpHaZudizPsbh",
    "taskId": "5GVjEf9Uw28lDp27QdAt",
    "startTime": "2025-06-17T13:21:00.000Z",
    "endTime": "2025-06-29T15:10:00.000Z",
    "priority": "media",
    "status": "pendiente",
    "requiereRelevo": true,
    "isGroupTask": false,
    "isFinished": false,
    "participants": [
      "ccdc3d942fde8068118ea018:7274dc7891a2cc44a0f65ee1fe05a4c0:366aaf96d88e6358cb6f",
      "a7f5ecc85c5ade8ad8df6215:ac0cccfcf19aec312d4df225703f80ec:541b4d20cecfa8473804"
    ],
    "shouldBeWorking": null,
    "currentlyWorking": null,
    "assignedBy": "64b5f870a4a5f3d8c8950c36:72789c773403625c2b2fef2fd2552ed1:e6da947fc9b821058faf",
    "empresaId": "febfd333-b692-4243-a822-48fbde752da8",
    "createdAt": "2025-06-17T22:50:26.597Z",
    "assignments": []
  }
]
```


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

**Query params opcionales:**
- `status`: Filtra por estado de la tarea (ej: "pendiente", "completada").
- `priority`: Filtra por prioridad (ej: "alta", "media", "baja").
- `requiereRelevo`: Si es `true`/`false`, filtra por tareas que requieren/no requieren relevo.

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

**Respuesta:**
Array de tareas de la empresa del usuario autenticado, filtradas según los parámetros enviados.

---

## 📝 `GET /tasks/:userId`

**Descripción:**
Devuelve todas las tareas asignadas a un usuario específico, consultado por su UID.

**Reglas de autorización:**
* Un **usuario normal** solo puede consultar sus *propias* tareas (el `:userId` debe coincidir con su propio UID autenticado).
* Un **administrador** puede consultar las tareas de *cualquier* usuario, **siempre y cuando ese usuario pertenezca a la misma empresa** que el administrador.

**Roles requeridos:** `Usuario` o `Administrador` (con las restricciones mencionadas).

**Método:** `GET`

**URL:** `/api/tasks/:userId`

**Parámetros de URL:**
* `userId` (string): UID del usuario cuyas tareas se desean consultar.

**Headers:**
* `Authorization`: `Bearer <token_del_usuario_autenticado>`
* `Content-Type`: `application/json` (opcional para GET)

**Query params opcionales:**
- `status`, `priority`, `today`, `week`, `requiereRelevo` (igual que en `/tasks`)

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
```

**Respuesta:**
Array de tareas asignadas al usuario solicitado, filtradas según los parámetros enviados.

---

## 📝 `POST /tasks/:taskInfoId/relief`

**Descripción:**
Genera y asigna un código de relevo temporal de 6 dígitos a una tarea que requiere relevo. El código es único, visible para el trabajador saliente y tiene una validez configurable (en minutos) que debe ser enviada en el body de la petición. El código y su expiración se almacenan en la tarea y se devuelven en la respuesta.

**Roles requeridos:**
- Trabajador asignado a la tarea o administrador de la empresa.

**Método:** `POST`

**URL:** `/api/tasks/:taskInfoId/relief`

**Parámetros de URL:**
- `taskInfoId` (string): ID de la tarea para la que se genera el código de relevo.

**Headers:**
- `Authorization`: `Bearer <token_usuario_o_admin>`
- `Content-Type`: `application/json`

**Body:**
```json
{
  "minutosValidez": 20 // Tiempo de validez del código en minutos
}
```

**Respuesta exitosa:**
```json
{
  "code": "123456",
  "expiresAt": "2025-06-19T18:00:00.000Z"
}
```

**Errores posibles:**
- 400: Faltan parámetros, minutos de validez inválidos, etc.
- 403: No autorizado (ni trabajador asignado ni admin).
- 404: Tarea no encontrada.
- 500: Error interno del servidor.

**Notas:**
- El código solo puede ser generado por el trabajador asignado o un administrador.
- El tiempo de validez es configurable por el frontend/administrador en cada solicitud.

---

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
Permite a un administrador crear un nuevo usuario. El UID para este usuario será generado automáticamente por Firebase Authentication y se utilizará como el identificador del documento en Firestore. Los campos `rut`, `name` y `lastName` se encriptarán automáticamente antes de su almacenamiento en la base de datos para proteger la información sensible. El empresaId del nuevo usuario será automáticamente heredado del empresaId del administrador que realiza la creación. Si es el primer usuario de una nueva empresa (es decir, el primer administrador creado sin un padre), se le asignará un nuevo empresaId único.

**Headers requeridos:**:
    `Authorization: "Bearer <token>"` (si el creador es un admin y se desea heredar el empresaId)
    `Content-Type: "application/json"`

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
Devuelve un mensaje de éxito con los datos del usuario creado, incluyendo los campos sensibles (rut, name, lastName) desencriptados, el UID generado por Firebase y el empresaId asignado, o un mensaje de error si falló alguna validación o permisos.

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
Devuelve las tareas asignadas a un usuario específico, permitiendo aplicar filtros por estado, prioridad, día o semana, también por si la tarea requiere relevo o no.
Tanto el usuario como un administrador pueden consultar esta ruta (el usuario solo puede ver sus propias tareas, el admin puede ver las de cualquiera). Los datos sensibles del usuario (nombre, apellido, RUT) se devolverán desencriptados en la respuesta.

**Parámetro en URL**:
    `uid` – UID del usuario cuyas tareas se desean consultar.

**Headers requeridos**:
    `Authorization: "Bearer <token_del_user_o_admin>"`

### Filtros disponibles (opcionales vía query params)

| Parámetro          | Tipo                    | Descripción                                                                                                    |
|--------------------|-------------------------|----------------------------------------------------------------------------------------------------------------|
| `status`           | string                  | Filtra por estado de la tarea (por ejemplo: `"pendiente"`, `"completada"`).                                    |
| `priority`         | string                  | Filtra por prioridad (por ejemplo: `"alta"`, `"media"`, `"baja"`).                                             |
| `today`            | boolean (como string)   | Si es `"true"`, filtra las tareas que tienen `startTime` en el día actual.                                    |
| `week`             | boolean (como string)   | Si es `"true"`, filtra las tareas programadas en la semana actual (lunes a domingo).                           |
| `requiereRelevo`   | boolean (como string)   | Si es `"true"`, solo retorna tareas que requieren relevo; si es `"false"`, solo tareas que no requieren relevo. Si no se incluye, retorna todas. |

> 🔸 **Nota**: Los filtros `today` y `week` son **excluyentes** entre sí. Si ambos están presentes, se evalúan en el orden del backend.

**Respuesta**:
Devuelve un objeto con:

- Información del usuario (id, name, lastName, rut) - *Nota: 'name', 'lastName' y 'rut' se devuelven desencriptados.*
- Conteo de tareas (count)
- Lista de tareas (tasks), cada una con:
  - id, title, description, status, priority
  - startTime, endTime, createdAt (como fechas JS)

**Ejemplo de fetch**:

```js
const queryParams = new URLSearchParams({
  status: "pendiente",
  priority: "alta",
  today: "true",
  requiereRelevo: "true" // Nuevo filtro: solo tareas que requieren relevo
});

fetch(`https://proyecto-ids.vercel.app/api/statustasks/${userId}?${queryParams.toString()}`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
})
```

## `PATCH /api/tasks/:taskId/status`
**Descripción**:
Permite a un usuario autenticado actualizar el estado de una tarea específica por su ID. La operación está restringida:
* Un **usuario normal** solo puede actualizar el estado de las tareas que le están **asignadas**.
* Un **administrador** puede actualizar el estado de cualquier tarea **dentro de su misma empresa**.
* Cuando el estado cambia a `"en curso"`, se registra `realStartTime` si no está ya establecido.
* Cuando el estado cambia a `"completada"`, se registra `realEndTime` si no está ya establecido y se descuenta 1 de `currentTasks` en el registro de asistencia del usuario asignado.

**Headers**:
Authorization: "Bearer <token>"
Content-Type: application/json

**Cuerpo del request**:
```json
{
    "status": "completada" // "pendiente", "en curso"
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

### Lógica y validaciones para tareas con y sin relevo
- **Campos obligatorios**: `assignedTo`, `description`, `startTime`, `endTime`, `title`, `requiereRelevo` (booleano).
- **NO se debe enviar**: `createdBy`, `empresaId`, `createdAt`, `realStartTime`, `realEndTime` (los gestiona el backend).
- **El campo `tiempoEstimado` no ha sido considerado**. La duración de la tarea se define por `startTime` y `endTime`.

#### Tarea SIN relevo (`requiereRelevo: false`)
- Solo puede tener **un** usuario asignado (`assignedTo` debe ser un array de un solo UID).
- No se deben enviar `trabajadorSaliente` ni `trabajadorEntrante`.

#### Tarea CON relevo (`requiereRelevo: true`)
- Debe tener al menos un usuario asignado (`assignedTo` debe incluir al menos el UID del trabajador saliente).
- `trabajadorSaliente` (UID) es obligatorio y debe estar en `assignedTo`.
- Si se especifica `trabajadorEntrante`, también debe estar en `assignedTo`.
- El backend inicializa los campos de relevo: `codigoRelevo` (null), `relevoValidado` (false), `relevoExpira` (null).

#### Validaciones generales
- Todos los usuarios asignados deben existir, pertenecer a la misma empresa y estar presentes laboralmente (check-in del día).
- No puede haber solapamiento de horarios con otras tareas activas del usuario.
- `startTime` y `endTime` deben ser fechas válidas y `endTime` > `startTime`.

**Headers**:
- `Authorization`: "Bearer <token_admin>"
- `Content-Type`: `application/json`

**Cuerpo del Request** (ejemplo tarea SIN relevo):
```json
{
  "assignedTo": ["UID_trabajador"],
  "description": "Limpieza de área común.",
  "startTime": "2025-05-30T09:00:00.000Z",
  "endTime": "2025-05-30T10:00:00.000Z",
  "priority": "alta",
  "status": "pendiente",
  "title": "Limpieza matutina",
  "requiereRelevo": false
}
```

**Cuerpo del Request** (ejemplo tarea CON relevo):
```json
{
  "assignedTo": ["UID_saliente", "UID_entrante"],
  "description": "Supervisión de portería con relevo.",
  "startTime": "2025-05-30T10:00:00.000Z",
  "endTime": "2025-05-30T18:00:00.000Z",
  "priority": "media",
  "status": "pendiente",
  "title": "Guardia portería turno día",
  "requiereRelevo": true,
  "trabajadorSaliente": "UID_saliente",
  "trabajadorEntrante": "UID_entrante"
}
```

**Respuesta exitosa**:
```json
{
  "id": "ID_TAREA_GENERADA",
  "assignedTo": ["UID_saliente", "UID_entrante"],
  "createdAt": "2025-05-29T12:00:00.000Z",
  "createdBy": "UID_ADMIN",
  "description": "Supervisión de portería con relevo.",
  "endTime": "2025-05-30T18:00:00.000Z",
  "priority": "media",
  "startTime": "2025-05-30T10:00:00.000Z",
  "status": "pendiente",
  "title": "Guardia portería turno día",
  "requiereRelevo": true,
  "trabajadorSaliente": "UID_saliente",
  "trabajadorEntrante": "UID_entrante",
  "codigoRelevo": null,
  "relevoValidado": false,
  "relevoExpira": null,
  "empresaId": "ID_EMPRESA"
}
```

**Errores posibles**:
- 400: Faltan campos obligatorios, tipos incorrectos, solapamiento de tareas, usuario no presente, reglas de relevo incumplidas.
- 403: Intento de asignar tarea a usuario de otra empresa.
- 404: Usuario asignado no encontrado.
- 500: Error interno del servidor.

---

## `POST /api/assignTask`

**Descripción**: Permite asignar tareas individuales o grupales. Soporta la creación de tareas para un solo usuario o para varios usuarios (tarea grupal), generando los documentos correspondientes en las colecciones `TaskInfo` y `tasksAssignments`.

### Lógica general
- Si `isGroupTask` es `true`, se debe enviar un array `participantAssignments` con los usuarios y sus tareas individuales.
- Si `isGroupTask` es `false` y `requiereRelevo` es `true`, se debe enviar un array `participantAssignments` con los usuarios y sus tareas individuales (caso relevo).
- Si `isGroupTask` es `false` y `requiereRelevo` es `false`, se debe enviar el campo `assignedTo` con el UID del usuario.
- Se valida la existencia de los usuarios antes de asignar la tarea.
- Se crean los documentos en `TaskInfo` (tarea general) y en `tasksAssignments` (asignaciones individuales).

### Campos esperados
- `isGroupTask` (boolean): Indica si es tarea grupal.
- `taskId` (string, opcional): ID de referencia para la tarea.
- `startTime` (string, fecha ISO): Fecha/hora de inicio general.
- `endTime` (string, fecha ISO): Fecha/hora de término general.
- `priority` (string): Prioridad (por defecto "normal").
- `status` (string): Estado inicial (por defecto "pendiente").
- `requiereRelevo` (boolean): Si requiere relevo.
- `participantAssignments` (array, solo grupal o individual con relevo): Cada elemento debe tener `{ userId, individualTask, startTimeIndividualTask, endTimeIndividualTask }`.
- `assignedTo` (string, solo individual sin relevo): UID del usuario asignado.

### Ejemplo de request para tarea grupal
```json
{
  "isGroupTask": true,
  "taskId": "9TQOx53T4eDowwa6e8SD",
  "priority": "alta",
  "status": "pendiente",
  "requiereRelevo": false,
  "startTime": "2025-06-14T13:00:00.000Z",
  "endTime": "2025-06-14T15:00:00.000Z",
  "participantAssignments": [
    {
      "userId": "UID_1",
      "individualTask": "Zona A",
      "startTimeIndividualTask": "2025-06-14T13:00:00.000Z",
      "endTimeIndividualTask": "2025-06-14T14:00:00.000Z"
    },
    {
      "userId": "UID_2",
      "individualTask": "Zona B",
      "startTimeIndividualTask": "2025-06-14T14:00:00.000Z",
      "endTimeIndividualTask": "2025-06-14T15:00:00.000Z"
    }
  ]
}
```

### Ejemplo de request para tarea individual con relevo
```json
{
  "isGroupTask": false,
  "taskId": "9TQOx53T4eDowwa6e8SD",
  "priority": "normal",
  "status": "pendiente",
  "requiereRelevo": true,
  "startTime": "2025-06-14T13:00:00.000Z",
  "endTime": "2025-06-14T15:00:00.000Z",
  "participantAssignments": [
    {
      "userId": "UID_1",
      "individualTask": "Turno mañana",
      "startTimeIndividualTask": "2025-06-14T13:00:00.000Z",
      "endTimeIndividualTask": "2025-06-14T14:00:00.000Z"
    },
    {
      "userId": "UID_2",
      "individualTask": "Turno tarde",
      "startTimeIndividualTask": "2025-06-14T14:00:00.000Z",
      "endTimeIndividualTask": "2025-06-14T15:00:00.000Z"
    }
  ]
}
```

### Ejemplo de request para tarea individual sin relevo
```json
{
  "isGroupTask": false,
  "taskId": "9TQOx53T4eDowwa6e8SD",
  "priority": "normal",
  "status": "pendiente",
  "requiereRelevo": false,
  "startTime": "2025-06-14T13:00:00.000Z",
  "endTime": "2025-06-14T14:00:00.000Z",
  "assignedTo": "UID_1"
}
```

### Respuestas
- **201**: Tarea(s) registrada(s) correctamente. Incluye el ID de `TaskInfo` y los datos de las asignaciones.
- **400**: Faltan campos obligatorios o formato incorrecto.
- **404**: Usuario(s) no encontrado(s).
- **500**: Error interno del servidor.

### Nota sobre herencia de nombre y descripción
- Solo si la tarea es **individual** y **sin relevo** (`requiereRelevo: false`), la asignación hereda el `title` y `description` de la plantilla en `tasks`.
- En tareas **con relevo** o **grupales**, cada asignación debe tener su propia descripción específica (`individualTask`).

### Nota sobre TaskInfo
- La colección `TaskInfo` no almacena directamente el `title` ni el `description` de la tarea.
- Estos campos están referenciados a través del `taskId`, que apunta a la plantilla en la colección `tasks`.

### Validación de solapamiento de tareas
- Antes de asignar una tarea, el backend verifica que ningún usuario tenga otra tarea asignada que se solape con el rango de tiempo solicitado (`startTimeIndividualTask` y `endTimeIndividualTask`).
- Si existe solapamiento, la asignación es rechazada y se retorna un error 400 indicando el usuario afectado.