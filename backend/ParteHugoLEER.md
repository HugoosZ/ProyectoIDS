Flujo de trabajo!!

La consulta llega a app.js, luego se va a routes, en routes se va a adminRoutes.js, donde se postea la cracion de usuario(userController) siempre cuando se haya pasado por el middleware que obtendrá el token del header(auth.js) el cual luego se utilizará para autentificar al usuario(authMiddleware.js).

La carpeta se llama controllers porque es un estandar donde en esta parte se ubica la logica que maneja las solicitudes y respuestas, son intermediarios entre las rutas y servicios, en este caso 


Inicialmente probé sin el auntentificador, por lo que funciona sin este mismo.