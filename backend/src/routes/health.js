import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/db', async (req, res) => {
  try {
    const result = await db.query('SELECT 1 as ok');
    res.json({ ok: true, rows: result.rows });
  } catch (err) {
    console.error('[HEALTH][DB] Erro ao conectar ao DB:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
