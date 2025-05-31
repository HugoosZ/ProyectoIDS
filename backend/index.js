const app= require('./app.js')  //recupera lo que se exporta en app
//import app from './app.js'; // 👈 Extensión .js obligatoria

app.listen(3000)
console.log('server is running on port 3000') //para mostrar lo que muestra app
