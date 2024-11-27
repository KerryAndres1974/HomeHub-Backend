const router = require('express').Router();
const pool = require('../database');

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