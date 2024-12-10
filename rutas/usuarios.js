const router = require("express").Router();
const pool = require('../database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


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
        res.status(500).json({ err: 'Error al agregar al empleado' });
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

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al editar el perfil' });
    }
});

router.post('/recuperar', async (req, res) => {
    const { email } = req.body;

    try {
        const query = 'SELECT * FROM usuario WHERE email = $1';
        const usuario = await pool.query(query, [email]);

        if (usuario.rows.length === 0) {
            return res.status(404).json({ message: 'Correo electrónico no encontrado' });
        }

        const resetCode = crypto.randomBytes(3).toString('hex'); // Genera un código aleatorio de 6 caracteres
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + 1); // La expiración es dentro de una hora

        // Actualizar el código de restablecimiento y la fecha de expiración en la base de datos
        const updateQuery = `
            UPDATE usuario SET reset_code = $1, reset_code_expiration = $2 WHERE email = $3
        `;
        await pool.query(updateQuery, [resetCode, expirationDate, email]);

        // Enviar correo electrónico con el código de recuperación
        const transporter = nodemailer.createTransport({
            service: 'gmail', // O cualquier otro servicio de correo
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperación de contraseña',
            text: `Tu código de recuperación es: ${resetCode}. Este código expirará en 1 hora.`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Correo de recuperación enviado' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al intentar recuperar la contraseña' });
    }
});


// Ruta para verificar el código de recuperación
router.post('/verify-code', async (req, res) => {
    const { email, codigo } = req.body;

    try {
        const query = 'SELECT * FROM usuario WHERE email = $1';
        const usuario = await pool.query(query, [email]);

        if (usuario.rows.length === 0) {
            return res.status(404).json({ message: 'Correo electrónico no encontrado' });
        }

        const user = usuario.rows[0];

        // Verificar si el código de restablecimiento es válido
        if (user.reset_code !== codigo) {
            return res.status(400).json({ message: 'Código de recuperación inválido' });
        }

        // Verificar si el código ha expirado
        const now = new Date();
        if (new Date(user.reset_code_expiration) < now) {
            return res.status(400).json({ message: 'El código ha expirado' });
        }

        res.status(200).json({ message: 'Código verificado correctamente' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al verificar el código' });
    }
});

// Ruta para restablecer la contraseña
router.post('/reset-password', async (req, res) => {
    const { usuario, password, correo } = req.body;

    try {
        const query = 'SELECT * FROM usuario WHERE email = $1';
        const usuarioResult = await pool.query(query, [correo]);

        if (usuarioResult.rows.length === 0) {
            return res.status(404).json({ message: 'Correo electrónico no encontrado' });
        }

        // Hashear la nueva contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);

        // Actualizar la contraseña en la base de datos
        const updateQuery = 'UPDATE usuario SET password = $1, reset_code = NULL, reset_code_expiration = NULL WHERE email = $2';
        await pool.query(updateQuery, [hashedPassword, correo]);

        res.status(200).json({ message: 'Contraseña actualizada correctamente' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al restablecer la contraseña' });
    }
});

module.exports = router;