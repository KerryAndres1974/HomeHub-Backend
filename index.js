const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');

// Configuracion de express
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Manejo y llamado de rutas
app.use('/login', require('./rutas/login'));

app.use('/proyectos', require('./rutas/proyectos'));
app.use('/imagenes', require('./rutas/imagenes'));
app.use('/asesorias', require('./rutas/asesorias'));
app.use('/usuarios', require('./rutas/usuarios'));

// Exportar app para pruebas
module.exports = app;