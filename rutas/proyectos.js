const router = require('express').Router();
const pool = require('../database');

router.post('/', async (req, res) => {
    const { direccion, descripcion, ciudad, tipo, precio, nombre, idusuario, imagenes } = req.body;
  
    try {
        const query = `INSERT INTO proyecto 
        (direccion, descripcion, ciudad, tipo, precio, nombre, idusuario, estado) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo') RETURNING *`;
        
        const result = await pool.query(query, [
            direccion, descripcion, ciudad, tipo, precio, nombre, idusuario
        ]);
        
        const idproyecto = result.rows[0].id;
        
        if (imagenes && imagenes.length > 0){
            const queryImg = `INSERT INTO imagenes (idproyecto, imagen) VALUES ($1, $2)`;
            for(const image of imagenes) {
                await pool.query(queryImg, [idproyecto, image]);
            }
        }

        res.status(201).json({ message: 'Proyecto registrado exitosamente', proyecto: result.rows[0] });
        
    } catch (error) {
        console.error('Error al crear proyecto', error);
        res.status(500).json({ message: 'Error al crear proyecto', error: error.message });
    }
});

router.put('/:idproyecto', async (req, res) => {

    const id = req.params.idproyecto;
    let { descripcion, ciudad, tipo, precio, nombre, direccion, imagenes } = req.body;

    try {
        // Verificar si el proyecto existe antes de realizar la actualización
        const query1 = 'SELECT * FROM proyecto WHERE id = $1';
        const existingProject = await pool.query(query1, [id]);

        if (existingProject.rows.length === 0) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }

        const idproyecto = existingProject.rows[0].id;
        if (imagenes && imagenes.length > 0){
            for(const imagen of imagenes) {
                const queryImg = `INSERT INTO imagenes (idproyecto, imagen) VALUES ($1, $2)`;
                await pool.query(queryImg, [idproyecto, imagen]);
            }
        }

        if(descripcion === '') {
            descripcion = existingProject.rows[0].descripcion;
        }
        if(ciudad === 'Ciudad') {
            ciudad = existingProject.rows[0].ciudad;
        }
        if(tipo === 'Tipo') {
            tipo = existingProject.rows[0].tipo;
        }
        if(precio === '') {
            precio = existingProject.rows[0].precio;
        }
        if(nombre === '') {
            nombre = existingProject.rows[0].nombre;
        }
        if(direccion === '') {
            direccion = existingProject.rows[0].direccion;
        }

        const query2 = `UPDATE proyecto SET 
        descripcion = $1, ciudad = $2, tipo = $3, precio = $4, nombre = $5, direccion = $6 WHERE id = $7`;

        const result = await pool.query(query2, [descripcion, ciudad, tipo, precio, nombre, direccion, idproyecto]);

        res.status(201).json({ message: 'Proyecto actualizado con exito', users: result.rows[0] });

    } catch(error) {
        console.log(error);
        res.status(500).json({ error: 'Error al completar el perfil' });
    }

});

module.exports = router