const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');

// Configuracion de express
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Configuracion del servidor
const PORT = 8000
app.listen(PORT, () => {
    console.log(`Servidor backend activo en el puerto ${PORT}\n`);
})

// Manejo y llamado de rutas
app.use('/login', require('./rutas/login'));
app.use('/register', require('./rutas/register'));

app.use('/proyectos', require('./rutas/proyectos'));
app.use('/imagenes', require('./rutas/imagenes'));
//app.use('/asesorias', require('./rutas/asesorias'));

// Exportar app para pruebas
module.exports = app;