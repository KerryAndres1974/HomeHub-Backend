const router = require('express').Router();
const pool = require('../database');

// Crear proyecto
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

// Obtener proyectos
router.get('/', async (req, res) => {

    try {
        const query = `SELECT p.* , (SELECT i.imagen
                FROM imagenes i WHERE i.idproyecto = p.id
                ORDER BY i.id ASC LIMIT 1) AS imagen
                FROM proyecto p WHERE p.estado = 'activo'`;

        const proyectos = await pool.query(query);

        res.json(proyectos.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener los proyectos' });
    }

});

// Obtener proyectos de usuario
router.get('/usuario/:idusuario', async (req, res) => {
    const idusuario = req.params.idusuario;

    try {
        const query = `SELECT p.* , (SELECT i.imagen
                FROM imagenes i WHERE i.idproyecto = p.id
                ORDER BY i.id ASC LIMIT 1) AS imagen
                FROM proyecto p WHERE p.idusuario = $1 AND p.estado = 'activo'`;
        const proyecto = await pool.query(query, [idusuario]);

        if (proyecto.rowCount === 0) {
            res.status(404).json({ message: 'Usuario sin proyectos' });
        }

        res.json(proyecto.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ err: 'Error al obtener proyectos' });
    }
});

// Obtener proyecto
router.get('/proyecto/:idproyecto', async (req, res) => {
    const idproyecto = req.params.idproyecto;

    try {
        const query = 'SELECT * FROM proyecto WHERE id = $1';
        const proyecto = await pool.query(query, [idproyecto]);

        if (proyecto.rowCount === 0) {
            return res.status(404).json({ message: 'No existe tal proyecto' });
        }

        res.json(proyecto.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ocurrió un error al obtener el proyecto.' });
    }
});

// Editar proyecto
router.put('/:idproyecto', async (req, res) => {

    const id = req.params.idproyecto;
    let { descripcion, ciudad, tipo, precio, nombre, direccion, estado, imagenes } = req.body;

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

        if (!descripcion || descripcion === '') {
            descripcion = existingProject.rows[0].descripcion;
        }
        if (!ciudad || ciudad === 'Ciudad') {
            ciudad = existingProject.rows[0].ciudad;
        }
        if (!tipo || tipo === 'Tipo') {
            tipo = existingProject.rows[0].tipo;
        }
        if (!precio || precio === '') {
            precio = existingProject.rows[0].precio;
        }
        if (!nombre || nombre === '') {
            nombre = existingProject.rows[0].nombre;
        }
        if (!direccion || direccion === '') {
            direccion = existingProject.rows[0].direccion;
        }
        if (!estado || estado === 'activo') {
            estado = existingProject.rows[0].estado;
        }

        const query2 = `UPDATE proyecto SET 
        descripcion = $1, ciudad = $2, tipo = $3, precio = $4, nombre = $5, direccion = $6, estado = $7 WHERE id = $8`;

        const result = await pool.query(query2, [descripcion, ciudad, tipo, precio, nombre, direccion, estado, idproyecto]);

        res.status(201).json({ message: 'Proyecto actualizado con exito', users: result.rows[0] });

    } catch(error) {
        console.log(error);
        res.status(500).json({ error: 'Error al editar el proyecto' });
    }

});

module.exports = router