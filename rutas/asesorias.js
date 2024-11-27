const router = require('express').Router();
const pool = require('../database');

// Crear una asesoria
router.post('/', async (req, res) => {
    const { mensaje, destinatario, remitente, correo, telefono, nombre } = req.body;

    try {
        const query = `INSERT INTO asesoria (mensaje, destinatario, remitente, correoremi, telefonoremi, nombreremi)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

        await pool.query(query, [mensaje, destinatario, remitente, correo, telefono, nombre]);

        res.json({ message: 'Se realizó la asesoria' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ err: 'Error al crear la asesoria' });
    }
});

// Obtener asesorias de usuario
router.get('/:idusuario', async (req, res) => {
    const idusuario = req.params.idusuario;

    try {
        const query = 'SELECT * FROM asesoria WHERE destinatario = $1';
        const asesoria = await pool.query(query, [idusuario]);

        if (asesoria.rowCount === 0) {
            return res.status(404).json({ message: 'No se encontraron asesorias para este usuario' });
        }

        res.json(asesoria.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener las asesorías.' });
    }
});

module.exports = router;