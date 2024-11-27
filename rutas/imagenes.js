const router = require('express').Router();
const pool = require('../database');

router.get('/:idproyecto', async (req, res) => {
    const idproyecto = req.params.idproyecto;

    try {
        const query = 'SELECT imagen FROM imagenes WHERE idproyecto = $1';
        const result = await pool.query(query, [idproyecto]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener imagenes', err);
        res.status(500).json({ message: err });
    }
});

//router.delete();

module.exports = router;