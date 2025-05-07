const app= require('./app.js')  //recupera lo que se exporta en app

app.listen(3000)
console.log('server is running on port 3000') //para mostrar lo que muestra app


app.get('/', (req, res) => {
    res.send('Prueba de que funciona');
  });
  
  // Configuración del puerto para Vercel
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  }).on('error', (err) => {
    console.error('Server error:', err);
  });