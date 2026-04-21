// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de la conexión a PostgreSQL en Render
// Es MUY importante el ssl: { rejectUnauthorized: false } para bases externas
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// 1. ENDPOINT DE SOLICITUD (POST) [cite: 10]
app.post('/api/solicitar-acceso', async (req, res) => {
    const { email, folio } = req.body;

    // 1. Validación de dominio (la que ya tenías)
    if (!email || !email.endsWith('@itses.edu.mx')) {
        return res.status(400).json({ error: 'El correo debe ser @itses.edu.mx' });
    }

    try {
        // 2. NUEVA VALIDACIÓN: Verificar si el folio ya existe en solicitudes
        const folioCheck = await pool.query(
            'SELECT * FROM solicitudes WHERE folio = $1', 
            [folio]
        );

        if (folioCheck.rows.length > 0) {
            return res.status(400).json({ 
                error: 'Este folio ya ha sido registrado por otro usuario.' 
            });
        }

        // 3. Proceder con el registro (tu código actual)
        const insertQuery = `
            INSERT INTO solicitudes (email, folio, estatus) 
            VALUES ($1, $2, 'Procesando') 
            RETURNING *;
        `;
        const result = await pool.query(insertQuery, [email, folio]);

        // Disparar Webhook a n8n [cite: 10, 19]
        await axios.post(process.env.N8N_WEBHOOK_URL, { email, folio });

        res.status(201).json({
            mensaje: 'Solicitud registrada correctamente',
            datos: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno al procesar la solicitud.' });
    }
});

// 2. ENDPOINT DE VERIFICACIÓN (GET) [cite: 11]
app.get('/api/verificar-estatus/:email', async (req, res) => {
    const { email } = req.params;

    try {
        const query = 'SELECT estatus FROM solicitudes WHERE email = $1';
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        res.json({ estatus: result.rows[0].estatus });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar el estatus' });
    }
});

// 3. ENDPOINT DE CALLBACK PARA N8N (PATCH) [cite: 12]
app.patch('/api/callback', async (req, res) => {
    // n8n enviará el email para indicarnos a quién aprobar
    const { email } = req.body; 

    try {
        const updateQuery = `
            UPDATE solicitudes 
            SET estatus = 'Aceptado' 
            WHERE email = $1 
            RETURNING *;
        `;
        const result = await pool.query(updateQuery, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No se pudo actualizar. Correo no encontrado.' });
        }

        res.json({
            mensaje: 'Estatus actualizado a Aceptado por n8n',
            datos: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el estatus' });
    }
});

// Levantar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Gatekeeper corriendo en el puerto ${PORT}`);
});