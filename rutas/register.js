const router = require("express").Router();
const pool = require('../database');
const bcrypt = require('bcrypt');

router.post("/", async (req, res) => {
    
    const { usuario, nombre, correo, pass, tel } = req.body;

    const queryEmail = 'SELECT * FROM users WHERE email = $1';
    const existeEmail = await pool.query(queryEmail, [correo]);

    if (existeEmail.rows.length > 0) {
        return res.status(400).json({ message: 'El correo electrónico ya está en uso' });
    }

    // Hashea la contraseña antes de almacenarla en la base de datos
    const hashedPassword = await bcrypt.hash(pass, 10);

    try {
        const query = `INSERT INTO users (username, name, email, phone, password)
                        VALUES ($1, $2, $3, $4, $5) RETURNING *`;

        const user = await pool.query(query, [usuario, nombre, correo, tel, hashedPassword]);

        res.status(201).json(user.rows[0]);

    } catch (err) {
        console.error('Error al agregar al nuevo empleado:', err);
        res.status(500).json({ err: 'Error al agregar al empleado'});
    }

});

module.exports = router;