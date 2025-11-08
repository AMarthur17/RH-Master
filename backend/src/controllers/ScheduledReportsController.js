import db from '../db.js';
import reportScheduler from '../services/reportScheduler.service.js';

class ScheduledReportsController {
	async list(req, res) {
		try {
			const { rows } = await db.query('SELECT * FROM scheduled_reports ORDER BY criado_em DESC');
			res.json(rows);
		} catch (err) {
			console.error('Erro ao listar agendamentos', err);
			res.status(500).json({ error: 'Erro ao listar agendamentos' });
		}
	}

	async create(req, res) {
		try {
			const { nome, report_type, formato, empresa, cron_expr, tipo_agendamento, start_at, emails } = req.body;
			// basic validation
			if (!report_type || !empresa) return res.status(400).json({ error: 'report_type e empresa são obrigatórios' });

			const q = `INSERT INTO scheduled_reports (nome, report_type, formato, empresa, cron_expr, tipo_agendamento, start_at, emails) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
			const params = [nome||null, report_type, formato||'pdf', empresa, cron_expr||null, tipo_agendamento||'recorrente', start_at||null, emails || []];
			const { rows } = await db.query(q, params);
			const created = rows[0];

			// schedule immediately in-memory
			try { if (created) await reportScheduler.start(); } catch(e) { console.warn('Erro ao recarregar scheduler', e); }

			res.status(201).json(created);
		} catch (err) {
			console.error('Erro ao criar agendamento', err && err.stack ? err.stack : err);
			res.status(500).json({ error: 'Erro ao criar agendamento' });
		}
	}

	async remove(req, res) {
		try {
			const { id } = req.params;
			await db.query('DELETE FROM scheduled_reports WHERE id = $1', [id]);
			res.json({ ok: true });
		} catch (err) {
			console.error('Erro ao remover agendamento', err);
			res.status(500).json({ error: 'Erro ao remover agendamento' });
		}
	}

	async runNow(req, res) {
		try {
			const { id } = req.params;
			const { rows } = await db.query('SELECT * FROM scheduled_reports WHERE id = $1', [id]);
			if (!rows || rows.length === 0) return res.status(404).json({ error: 'Agendamento não encontrado' });
			const schedule = rows[0];
			reportScheduler.runJob(schedule);
			res.json({ ok: true });
		} catch (err) {
			console.error('Erro ao executar agendamento agora', err);
			res.status(500).json({ error: 'Erro ao executar agendamento' });
		}
	}
}

export default new ScheduledReportsController();
