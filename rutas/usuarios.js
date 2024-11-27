const router = require("express").Router();
const pool = require('../database');
const bcrypt = require('bcrypt');

// Registrar usuario
router.post('/', async (req, res) => {
    
    const { user, name, password, email, phone } = req.body;

    try {
        const queryEmail = 'SELECT * FROM usuario WHERE email = $1';
        const existeEmail = await pool.query(queryEmail, [email]);

        if (existeEmail.rows.length > 0) {
            return res.status(400).json({ message: 'El correo electrónico ya está en uso' });
        }

        // Hashea la contraseña antes de almacenarla en la base de datos
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `INSERT INTO usuario (username, name, password, email, phone)
                        VALUES ($1, $2, $3, $4, $5) RETURNING *`;

        const usuario = await pool.query(query, [user, name, hashedPassword, email, phone]);

        res.status(201).json(usuario.rows[0]);

    } catch (err) {
        console.error('Error al agregar al nuevo empleado:', err);
        res.status(500).json({ err: 'Error al agregar al empleado'});
    }

});

// Obtener usuario
router.get('/:idusuario', async (req, res) => {
    const idusuario = req.params.idusuario;

    try {
        const query = 'SELECT * FROM usuario WHERE id = $1';
        const usuario = await pool.query(query, [idusuario]);

        if (usuario.rowCount === 0) {
            return res.status(404).json({ message: 'No se encontró usuario' });
        }

        res.json(usuario.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener al usuario.' });
    }
});

// Editar usuario
router.put('/:idusuario', async (req, res) => {
    const idusuario = req.params.idusuario;
    let { name, password, email, phone, fotoperfil } = req.body;

    try {
        // Verificar si el proyecto existe antes de realizar la actualización
        const query1 = 'SELECT * FROM usuario WHERE id = $1';
        const existingUser = await pool.query(query1, [idusuario]);

        if (existingUser.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (name === '') {
            name = existingUser.rows[0].name;
        }
        if (password) {
            password = await bcrypt.hash(password, 10);
        } else if (password === '') {
            password = existingUser.rows[0].password;
        }
        if (email === '') {
            email = existingUser.rows[0].email;
        }
        if (phone === '') {
            phone = existingUser.rows[0].phone;
        }
        if (fotoperfil === '') {
            fotoperfil = existingUser.rows[0].fotoperfil;
        }

        const query2 = `UPDATE usuario SET 
        name = $1, password = $2, email = $3, phone = $4, fotoperfil = $5 WHERE id = $6`;

        const result = await pool.query(query2, [name, password, email, phone, fotoperfil, idusuario]);

        res.status(201).json({ message: 'Usuario actualizado con exito', users: result.rows[0] });

    } catch(error) {
        console.log(error);
        res.status(500).json({ error: 'Error al editar el perfil' });
    }
});

module.exports = router;