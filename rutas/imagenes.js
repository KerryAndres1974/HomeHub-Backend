const router = require('express').Router();
const pool = require('../database');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_APIKEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Obtener imagenes del proyecto
router.get('/:idproyecto', async (req, res) => {
    const idproyecto = req.params.idproyecto;

    try {
        const query = 'SELECT id, imagen_url FROM imagen WHERE idproyecto = $1';
        const imagenes = await pool.query(query, [idproyecto]);

        res.json(imagenes.rows);
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ err: 'Error al obtener imagenes' });
    }
});

// Borrar imagenes del proyecto
router.delete('/:idimagen', async (req, res) => {
    const idimagen = req.params.idimagen;

    try {
        const queryE = 'SELECT imagen_url FROM imagen WHERE id = $1';
        const imagen = await pool.query(queryE, [idimagen]);

        if (imagen.rowCount === 0) {
            res.status(404).json({ message: 'Imagen no encontrada' });
        }

        const imagenUrl = imagen.rows[0].imagen;
        const regex = /\/v\d+\/([^\/]+\/[^\/]+)\.[a-z]+$/;
        const match = imagenUrl.match(regex);
        const public_id = match[1];
        console.log(public_id)

        await cloudinary.uploader.destroy(public_id);

        const queryD = 'DELETE FROM imagen WHERE id = $1';
        await pool.query(queryD, [idimagen]);

        res.json({ message: 'Imagen eliminada' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ocurrió un error al eliminar la imagen' });
    }
});

module.exports = router;