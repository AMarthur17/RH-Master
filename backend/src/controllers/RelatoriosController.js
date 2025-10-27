import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import db from '../db.js';

class RelatoriosController {
  async gerarRelatorioFuncionarios(req, res) {
    const { empresa, formato } = req.query;
    try {
      // Buscar dados dos funcionários
      const { rows: funcionarios } = await db.query(
        'SELECT id, nome, email, cargo, criado_em FROM usuario WHERE empresa = $1',
        [empresa]
      );

      if (formato === 'pdf') {
        const doc = new PDFDocument();
        
        // Configurar cabeçalho do PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=lista-funcionarios-${new Date().toISOString().split('T')[0]}.pdf`);
        doc.pipe(res);

        // Título
        doc.fontSize(20).text('Lista de Funcionários', { align: 'center' });
        doc.moveDown();

  // Cabeçalho da tabela
  doc.fontSize(12);
  doc.text('Nome', 50, 150);
  doc.text('Email', 230, 150);
  doc.text('Cargo', 390, 150);
  doc.text('Criado Em', 490, 150);

        // Dados
        let y = 180;
        funcionarios.forEach(func => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
          doc.text(func.nome, 50, y);
          doc.text(func.email, 200, y);
          doc.text(func.cargo, 350, y);
          doc.text(new Date(func.criado_em).toLocaleDateString(), 490, y);
          y += 30;
        });

        doc.end();
      } else if (formato === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Funcionários');

        worksheet.columns = [
          { header: 'ID', key: 'id', width: 8 },
          { header: 'Nome', key: 'nome', width: 30 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Cargo', key: 'cargo', width: 20 },
          { header: 'Criado Em', key: 'criado_em', width: 15 }
        ];

        funcionarios.forEach(func => {
          worksheet.addRow({
            id: func.id,
            nome: func.nome,
            email: func.email,
            cargo: func.cargo,
            criado_em: func.criado_em ? new Date(func.criado_em).toLocaleDateString() : ''
          });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=lista-funcionarios-${new Date().toISOString().split('T')[0]}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
      }
    } catch (error) {
      console.error('Erro ao gerar relatório (funcionarios):', error && error.stack ? error.stack : error);
      res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  }

  async gerarRelatorioPresenca(req, res) {
    const { empresa, formato } = req.query;
    try {
      const { rows: registros } = await db.query(
        `SELECT u.nome, rp.data_hora, rp.tipo 
         FROM registro_ponto rp 
         JOIN usuario u ON rp.usuario_id = u.id 
         WHERE u.empresa = $1 
         AND rp.data_hora >= NOW() - INTERVAL '30 days'
         ORDER BY u.nome, rp.data_hora`,
        [empresa]
      );

      if (formato === 'pdf') {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=registro-presenca-${new Date().toISOString().split('T')[0]}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text('Registro de Presença - Últimos 30 dias', { align: 'center' });
        doc.moveDown();

        let currentUser = '';
        let y = 150;

        registros.forEach(reg => {
          if (currentUser !== reg.nome) {
            if (y > 700) {
              doc.addPage();
              y = 50;
            }
            doc.fontSize(14).text(reg.nome, 50, y);
            y += 30;
            currentUser = reg.nome;
          }

          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          doc.fontSize(12).text(
            `${new Date(reg.data_hora).toLocaleDateString()} ${new Date(reg.data_hora).toLocaleTimeString()} - ${reg.tipo}`,
            70,
            y
          );
          y += 20;
        });

        doc.end();
      } else if (formato === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Registro de Presença');

        worksheet.columns = [
          { header: 'Nome', key: 'nome', width: 30 },
          { header: 'Data', key: 'data', width: 20 },
          { header: 'Hora', key: 'hora', width: 15 },
          { header: 'Tipo', key: 'tipo', width: 15 }
        ];

        registros.forEach(reg => {
          const data = new Date(reg.data_hora);
          worksheet.addRow({
            nome: reg.nome,
            data: data.toLocaleDateString(),
            hora: data.toLocaleTimeString(),
            tipo: reg.tipo
          });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=registro-presenca-${new Date().toISOString().split('T')[0]}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
      }
    } catch (error) {
      console.error('Erro ao gerar relatório (presenca):', error && error.stack ? error.stack : error);
      res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  }

  async gerarRelatorioBeneficios(req, res) {
    const { empresa, formato } = req.query;
    try {
      const { rows: beneficios } = await db.query(
        `SELECT u.nome, b.tipo as beneficio, b.valor, b.ativo as ativo
         FROM beneficios b
         JOIN usuario u ON b.usuario_id = u.id
         WHERE u.empresa = $1
         ORDER BY u.nome, b.tipo`,
        [empresa]
      );

      if (formato === 'pdf') {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=beneficios-${new Date().toISOString().split('T')[0]}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text('Relatório de Benefícios', { align: 'center' });
        doc.moveDown();

        let currentUser = '';
        let y = 150;

        beneficios.forEach(ben => {
          if (currentUser !== ben.nome) {
            if (y > 700) {
              doc.addPage();
              y = 50;
            }
            doc.fontSize(14).text(ben.nome, 50, y);
            y += 30;
            currentUser = ben.nome;
          }

          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          doc.fontSize(12).text(
            `${ben.beneficio} - R$ ${ben.valor} - ${ben.ativo ? 'Ativo' : 'Inativo'}`,
            70,
            y
          );
          y += 20;
        });

        doc.end();
      } else if (formato === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Benefícios');

        worksheet.columns = [
          { header: 'Funcionário', key: 'nome', width: 30 },
          { header: 'Benefício', key: 'beneficio', width: 25 },
          { header: 'Valor', key: 'valor', width: 15 },
          { header: 'Status', key: 'status', width: 15 }
        ];

        beneficios.forEach(ben => {
          worksheet.addRow({
            nome: ben.nome,
            beneficio: ben.beneficio,
            valor: ben.valor,
            ativo: ben.ativo ? 'Sim' : 'Não'
          });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=beneficios-${new Date().toISOString().split('T')[0]}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
      }
    } catch (error) {
      console.error('Erro ao gerar relatório (beneficios):', error && error.stack ? error.stack : error);
      res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  }

  async gerarRelatorioFolha(req, res) {
    const { empresa, formato } = req.query;
    try {
      const { rows: folhas } = await db.query(
        `SELECT u.nome, fp.mes, fp.ano, fp.salario_base, fp.valor, fp.status
         FROM folha_pagamento fp
         JOIN usuario u ON fp.usuario_id = u.id
         WHERE u.empresa = $1
         AND (fp.criado_em >= NOW() - INTERVAL '3 months' OR fp.atualizado_em >= NOW() - INTERVAL '3 months')
         ORDER BY u.nome, fp.ano DESC, fp.mes DESC`,
        [empresa]
      );

      if (formato === 'pdf') {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=folha-pagamento-${new Date().toISOString().split('T')[0]}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text('Resumo da Folha de Pagamento', { align: 'center' });
        doc.moveDown();

        let currentUser = '';
        let y = 150;

        folhas.forEach(folha => {
          if (currentUser !== folha.nome) {
            if (y > 700) {
              doc.addPage();
              y = 50;
            }
            doc.fontSize(14).text(folha.nome, 50, y);
            y += 30;
            currentUser = folha.nome;
          }

          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          doc.fontSize(12).text(
            `Ref: ${folha.mes}/${folha.ano} - Base: R$ ${Number(folha.salario_base).toFixed(2)} - Valor: R$ ${Number(folha.valor).toFixed(2)} - Status: ${folha.status}`,
            70,
            y
          );
          y += 20;
        });

        doc.end();
      } else if (formato === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Folha de Pagamento');

        worksheet.columns = [
          { header: 'Funcionário', key: 'nome', width: 30 },
          { header: 'Mês', key: 'mes', width: 8 },
          { header: 'Ano', key: 'ano', width: 8 },
          { header: 'Salário Base', key: 'salario_base', width: 15 },
          { header: 'Valor', key: 'valor', width: 15 },
          { header: 'Status', key: 'status', width: 15 }
        ];

        folhas.forEach(folha => {
          worksheet.addRow({
            nome: folha.nome,
            mes: folha.mes,
            ano: folha.ano,
            salario_base: folha.salario_base,
            valor: folha.valor,
            status: folha.status
          });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=folha-pagamento-${new Date().toISOString().split('T')[0]}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
      }
    } catch (error) {
      console.error('Erro ao gerar relatório (folha):', error && error.stack ? error.stack : error);
      res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  }
}

export default new RelatoriosController();