import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import db from '../db.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import nodemailer from 'nodemailer';

const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
const reportsDir = path.resolve(uploadsDir, 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const scheduledJobs = new Map();

function parseEmails(value) {
	if (!value) return [];
	if (Array.isArray(value)) return value;
	if (typeof value === 'string') {
		try { return JSON.parse(value); } catch { return value.split(',').map(s => s.trim()).filter(Boolean); }
	}
	return [];
}

async function writeLog(scheduledReportId, status, message, arquivoCaminho = null) {
	try {
		await db.query(
			'INSERT INTO scheduled_report_logs (scheduled_report_id, status, message, arquivo_caminho) VALUES ($1,$2,$3,$4)',
			[scheduledReportId, status, message, arquivoCaminho]
		);
	} catch (err) {
		console.error('Erro ao gravar log de agendamento:', err);
	}
}

async function generateReportFile(report) {
	// report: { id, nome, report_type, formato, empresa }
	const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
	const filenameBase = `${report.report_type || 'relatorio'}-${report.empresa || 'empresa'}-${timestamp}`;
	const arquivoPath = path.join(reportsDir, `${filenameBase}.${report.formato === 'xlsx' ? 'xlsx' : 'pdf'}`);

	try {
		if (report.formato === 'xlsx') {
			const workbook = new ExcelJS.Workbook();
			const ws = workbook.addWorksheet('Relatorio');
			// Simple implementations per tipo
			if (report.report_type === 'lista') {
				ws.columns = [{ header: 'ID', key: 'id' }, {header:'Nome', key:'nome'}, {header:'Email', key:'email'}];
				const { rows } = await db.query('SELECT id, nome, email FROM usuario WHERE empresa = $1', [report.empresa]);
				rows.forEach(r => ws.addRow(r));
			} else if (report.report_type === 'presenca') {
				ws.columns = [{header:'Nome',key:'nome'},{header:'DataHora',key:'data_hora'},{header:'Tipo',key:'tipo'}];
				const { rows } = await db.query(`SELECT u.nome, rp.data_hora, rp.tipo FROM registro_ponto rp JOIN usuario u ON rp.usuario_id = u.id WHERE u.empresa = $1 ORDER BY u.nome`, [report.empresa]);
				rows.forEach(r => ws.addRow({nome:r.nome,data_hora:r.data_hora,tipo:r.tipo}));
					} else if (report.report_type === 'beneficios') {
				ws.columns = [{header:'Nome',key:'nome'},{header:'Beneficio',key:'beneficio'},{header:'Valor',key:'valor'}];
				const { rows } = await db.query(`SELECT u.nome, b.tipo as beneficio, b.valor FROM beneficios b JOIN usuario u ON b.usuario_id = u.id WHERE u.empresa = $1 ORDER BY u.nome`, [report.empresa]);
				rows.forEach(r => ws.addRow(r));
					} else if (report.report_type === 'folha' || report.report_type === 'folha_pagamento') {
						ws.columns = [
							{ header: 'Funcionário', key: 'nome', width: 30 },
							{ header: 'Mês', key: 'mes', width: 8 },
							{ header: 'Ano', key: 'ano', width: 8 },
							{ header: 'Salário Base', key: 'salario_base', width: 15 },
							{ header: 'Valor', key: 'valor', width: 15 },
							{ header: 'Status', key: 'status', width: 15 }
						];
						const { rows } = await db.query(
							`SELECT u.nome, fp.mes, fp.ano, fp.salario_base, fp.valor, fp.status
							 FROM folha_pagamento fp
							 JOIN usuario u ON fp.usuario_id = u.id
							 WHERE u.empresa = $1
							 ORDER BY u.nome, fp.ano DESC, fp.mes DESC`,
							[report.empresa]
						);
						rows.forEach(r => ws.addRow({ nome: r.nome, mes: r.mes, ano: r.ano, salario_base: r.salario_base, valor: r.valor, status: r.status }));
			} else {
				ws.addRow(['Relatório não implementado para este tipo.']);
			}
			await workbook.xlsx.writeFile(arquivoPath);
			return arquivoPath;
		}

		// default PDF
		const doc = new PDFDocument();
		const stream = fs.createWriteStream(arquivoPath);
		doc.pipe(stream);
		doc.fontSize(18).text(`Relatório: ${report.report_type || ''}`, { align: 'center' });
		doc.moveDown();

		if (report.report_type === 'lista') {
			const { rows } = await db.query('SELECT id, nome, email, cargo FROM usuario WHERE empresa = $1', [report.empresa]);
			rows.forEach(r => {
				doc.fontSize(12).text(`${r.id} - ${r.nome} - ${r.email} - ${r.cargo}`);
				doc.moveDown(0.2);
			});
			} else if (report.report_type === 'presenca') {
			const { rows } = await db.query(`SELECT u.nome, rp.data_hora, rp.tipo FROM registro_ponto rp JOIN usuario u ON rp.usuario_id = u.id WHERE u.empresa = $1 ORDER BY u.nome`, [report.empresa]);
			rows.forEach(r => doc.text(`${r.nome} - ${new Date(r.data_hora).toLocaleString()} - ${r.tipo}`));
			} else if (report.report_type === 'beneficios') {
			const { rows } = await db.query(`SELECT u.nome, b.tipo as beneficio, b.valor FROM beneficios b JOIN usuario u ON b.usuario_id = u.id WHERE u.empresa = $1 ORDER BY u.nome`, [report.empresa]);
			rows.forEach(r => doc.text(`${r.nome} - ${r.beneficio} - R$ ${r.valor}`));
			} else if (report.report_type === 'folha' || report.report_type === 'folha_pagamento') {
				const { rows } = await db.query(
					`SELECT u.nome, fp.mes, fp.ano, fp.salario_base, fp.valor, fp.status
					 FROM folha_pagamento fp
					 JOIN usuario u ON fp.usuario_id = u.id
					 WHERE u.empresa = $1
					 ORDER BY u.nome, fp.ano DESC, fp.mes DESC`,
					[report.empresa]
				);
				rows.forEach(r => {
					doc.text(`${r.nome} - ${r.mes}/${r.ano} - Base: R$ ${Number(r.salario_base).toFixed(2)} - Valor: R$ ${Number(r.valor).toFixed(2)} - Status: ${r.status}`);
					doc.moveDown(0.2);
				});
		} else {
			doc.text('Tipo de relatório não implementado pelo scheduler.');
		}

		doc.end();

		await new Promise((resolve, reject) => stream.on('finish', resolve).on('error', reject));
		return arquivoPath;
	} catch (err) {
		console.error('Erro ao gerar arquivo de relatório:', err);
		throw err;
	}
}

async function sendEmailWithAttachment(emails, subject, text, attachmentPath) {
	if (!process.env.SMTP_HOST) return; // SMTP não configurado
	try {
		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
			secure: process.env.SMTP_SECURE === 'true',
			auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
		});

		await transporter.sendMail({
			from: process.env.SMTP_FROM || process.env.SMTP_USER,
			to: emails.join(','),
			subject,
			text,
			attachments: [{ path: attachmentPath }]
		});
	} catch (err) {
		console.error('Erro ao enviar email:', err);
		throw err;
	}
}

async function runJob(schedule) {
	try {
		const arquivo = await generateReportFile(schedule);
		await writeLog(schedule.id, 'success', 'Gerado com sucesso', arquivo);
		const emails = parseEmails(schedule.emails);
		if (emails.length > 0 && process.env.SMTP_HOST) {
			await sendEmailWithAttachment(emails, `Relatório ${schedule.nome || schedule.report_type}`, 'Segue o relatório em anexo.', arquivo);
		}
		console.log(`[Scheduler] execução concluída para agendamento ${schedule.id}`);
	} catch (err) {
		console.error('[Scheduler] erro ao executar job', err);
		await writeLog(schedule.id, 'failed', err && err.message ? err.message : String(err));
	}
}

function scheduleTimeoutForOneTime(schedule) {
	if (!schedule.start_at) return;
	const when = new Date(schedule.start_at);
	const delay = when.getTime() - Date.now();
	if (delay <= 0) return; // já passou
	const t = setTimeout(async () => {
		await runJob(schedule);
		// marcar inativo
		try { await db.query('UPDATE scheduled_reports SET ativo = false WHERE id = $1', [schedule.id]); } catch(e){console.error(e)}
		scheduledJobs.delete(schedule.id);
	}, delay);
	scheduledJobs.set(schedule.id, { type: 'timeout', handle: t });
}

function scheduleCronJob(schedule) {
	// suporta cron_expr normal ou marcador FIRST_BUSINESS_DAY@HH:MM
	if (schedule.cron_expr && schedule.cron_expr.startsWith('FIRST_BUSINESS_DAY@')) {
		const time = schedule.cron_expr.split('@')[1];
		const [hh, mm] = time.split(':').map(s => s.padStart(2,'0'));
		// rodar todo dia às hh:mm e executar somente se for o 1º dia útil do mês
		const task = cron.schedule(`${mm} ${hh} * * *`, async () => {
			const now = new Date();
			// encontrar primeiro dia útil do mês
			const year = now.getFullYear();
			const month = now.getMonth();
			let d = new Date(year, month, 1);
			while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
			if (d.getDate() === now.getDate()) {
				await runJob(schedule);
			}
		});
		scheduledJobs.set(schedule.id, { type: 'cron', handle: task });
		return;
	}

	if (schedule.cron_expr) {
		try {
			const task = cron.schedule(schedule.cron_expr, async () => { await runJob(schedule); });
			scheduledJobs.set(schedule.id, { type: 'cron', handle: task });
		} catch (err) {
			console.error('Cron expression inválida para agendamento', schedule.id, schedule.cron_expr, err);
		}
	}
}

async function loadSchedules() {
	try {
		const { rows } = await db.query('SELECT * FROM scheduled_reports WHERE ativo = true');
		rows.forEach(r => {
			if (r.tipo_agendamento === 'one-time') scheduleTimeoutForOneTime(r);
			else scheduleCronJob(r);
		});
		console.log(`[Scheduler] carregados ${rows.length} agendamento(s)`);
	} catch (err) {
		console.error('[Scheduler] erro ao carregar agendamentos', err);
	}
}

async function start() {
	await loadSchedules();
}

async function stop() {
	for (const [id, job] of scheduledJobs) {
		if (job.type === 'cron') job.handle.stop();
		if (job.type === 'timeout') clearTimeout(job.handle);
	}
	scheduledJobs.clear();
}

export default { start, stop, runJob };
