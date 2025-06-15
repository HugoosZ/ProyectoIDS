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
- Si `isGroupTask` es `false`, se debe enviar el campo `assignedTo` con el UID del usuario.
- Se valida la existencia de los usuarios antes de asignar la tarea.
- Se crean los documentos en `TaskInfo` (tarea general) y en `tasksAssignments` (asignaciones individuales).

### Campos esperados
- `isGroupTask` (boolean): Indica si es tarea grupal.
- `taskId` (string, opcional): ID de referencia para la tarea.
- `title` (string): Título de la tarea.
- `description` (string): Descripción de la tarea.
- `startTime` (string, fecha ISO): Fecha/hora de inicio.
- `endTime` (string, fecha ISO): Fecha/hora de término.
- `priority` (string): Prioridad (por defecto "normal").
- `status` (string): Estado inicial (por defecto "pendiente").
- `requiereRelevo` (boolean): Si requiere relevo.
- `participantAssignments` (array, solo grupal): Cada elemento debe tener `{ userId, individualTask }`.
- `assignedTo` (string, solo individual): UID del usuario asignado.
- `individualTask` (string, opcional): Descripción específica para la tarea individual.

### Ejemplo de request para tarea grupal
```json
{
  "isGroupTask": true,
  "title": "Inventario nocturno",
  "description": "Revisión de inventario por equipo",
  "startTime": "2025-06-15T20:00:00.000Z",
  "endTime": "2025-06-15T22:00:00.000Z",
  "priority": "alta",
  "requiereRelevo": false,
  "participantAssignments": [
    { "userId": "UID_1", "individualTask": "Zona A" },
    { "userId": "UID_2", "individualTask": "Zona B" }
  ]
}
```

### Ejemplo de request para tarea individual
```json
{
  "isGroupTask": false,
  "title": "Reporte diario",
  "description": "Completar reporte de actividades",
  "startTime": "2025-06-15T08:00:00.000Z",
  "endTime": "2025-06-15T09:00:00.000Z",
  "priority": "media",
  "requiereRelevo": false,
  "assignedTo": "UID_3",
  "individualTask": "Reporte de limpieza"
}
```

### Respuestas
- **201**: Tarea(s) registrada(s) correctamente. Incluye el ID de `TaskInfo` y los datos de las asignaciones.
- **400**: Faltan campos obligatorios o formato incorrecto.
- **404**: Usuario(s) no encontrado(s).
- **500**: Error interno del servidor.

### Nota importante sobre herencia de nombre y descripción
- Solo si la tarea es **individual** y **sin relevo** (`requiereRelevo: false`), se heredan el `title` y `description` de la plantilla en `tasks` o de la tarea general en `TaskInfo`.
- En tareas **con relevo** o **grupales**, cada asignación debe tener su propia descripción específica (`individualTask`).

### Nota sobre TaskInfo
- La colección `TaskInfo` no almacena directamente el `title` ni el `description` de la tarea.
- Estos campos están referenciados a través del `taskId`, que apunta a la plantilla en la colección `tasks`.