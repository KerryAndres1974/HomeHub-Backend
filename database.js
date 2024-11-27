require('dotenv').config()
const { Pool } = require('pg')

// Creamos una instancia de Pool con las variables de entorno
const pool = new Pool({
    user: process.env.DBUSER,
    host: process.env.DBHOST,
    database: process.env.DBNAME,
    password: process.env.DBPASSWORD,
    port: process.env.DBPORTS
})

module.exports = pool