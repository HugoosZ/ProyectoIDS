## Inicialización de la base de datos

Para inicializar la conexión con Firebase desde el backend, se debe usar el archivo `.json` proporcionado por Firebase.

Luego, usa el siguiente código (js):

```javascript
var admin = require("firebase-admin");

var serviceAccount = require("path/to/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
