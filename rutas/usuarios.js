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

        res.json(usuario.rows[0]);

    } catch (err) {
        console.error('Error al agregar al nuevo empleado:', err);
        res.status(500).json({ err: 'Error al agregar al empleado'});
    }

});

// Obtener todos los usuarios
router.get('/', async (req, res) => {

    try {
        const query = `SELECT u.*,
             COUNT(CASE WHEN p.estado = 'activo' THEN 1 END) AS proyectos_activos,
             COUNT(CASE WHEN p.estado = 'vendido' THEN 1 END) AS proyectos_vendidos,
             COUNT(CASE WHEN p.estado = 'inactivo' THEN 1 END) AS proyectos_inactivos
            FROM usuario u
            LEFT JOIN proyecto p
            ON u.id = p.idusuario
            GROUP BY u.id`;

        const usuarios = await pool.query(query);
        res.json(usuarios.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
})

// Obtener propiedades de usuario
router.get('/propiedades/:estado/:idusuario', async (req, res) => {
    const estado = req.params.estado;
    const idusuario = req.params.idusuario;

    try {
        const query = `SELECT p.*, (SELECT i.imagen_url
                FROM imagen i WHERE i.idproyecto = p.id
                ORDER BY i.id ASC LIMIT 1) AS imagen 
                FROM proyecto p WHERE idusuario = $1 AND estado = $2`;
        const proyecto = await pool.query(query, [idusuario, estado]);
        res.json(proyecto.rows);
    } catch (err){
        console.log(err);
        res.status(500).json({ error: 'Error al obtener los proyectos' });
    }
})

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
    const update = { ...req.body };
    
    try {
        const campos = Object.keys(update);
        const valores = [];
        
        if (campos.length === 0) {
            return res.status(404).json({ message: 'Actualización sin cambios' });
        }
        
        if (update.password) {
            const hashed = await bcrypt.hash(update.password, 10);
            update.password = hashed;
        }

        const clausula = campos.map((campo, i) => `${campo} = $${i + 1}`).join(', ');
        valores.push(...Object.values(update), idusuario);

        const query = `UPDATE usuario SET ${clausula} WHERE id = $${valores.length}`;
        const usuario = await pool.query(query, valores);
        
        if (usuario.rowCount === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        res.json(usuario.rows);

    } catch(error) {
        console.log(error);
        res.status(500).json({ error: 'Error al editar el usuario' });
    }
});

module.exports = router;