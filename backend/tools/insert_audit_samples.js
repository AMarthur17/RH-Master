import db from '../src/db.js';

async function run() {
  try {
    const now = new Date().toISOString();
    const inserts = [
      {
        usuario_id: null,
        usuario_nome: 'Test Admin',
        usuario_email: 'admin@test.com',
        acao: 'CRIAR_USUARIO',
        categoria: 'USUARIO',
        descricao: 'Teste - criação de usuário de demonstração',
        endpoint: '/usuario',
        metodo: 'POST',
        ip_address: '127.0.0.1',
        user_agent: 'script',
        resultado: 'SUCESSO',
        nivel_criticidade: 'ALTO',
        data_hora: now,
        metadata: { exemplo: true }
      },
      {
        usuario_id: null,
        usuario_nome: 'Test Admin',
        usuario_email: 'admin@test.com',
        acao: 'EXCLUIR_USUARIO',
        categoria: 'USUARIO',
        descricao: 'Teste - exclusão de usuário de demonstração',
        endpoint: '/usuario/123',
        metodo: 'DELETE',
        ip_address: '127.0.0.1',
        user_agent: 'script',
        resultado: 'SUCESSO',
        nivel_criticidade: 'CRITICO',
        data_hora: now,
        metadata: { exemplo: true }
      }
    ];

    for (const it of inserts) {
      const query = `
        INSERT INTO audit_logs (
          usuario_id, usuario_nome, usuario_email, acao, categoria, descricao,
          endpoint, metodo, ip_address, user_agent, resultado, nivel_criticidade,
          data_hora, metadata
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id
      `;
      const vals = [
        it.usuario_id,
        it.usuario_nome,
        it.usuario_email,
        it.acao,
        it.categoria,
        it.descricao,
        it.endpoint,
        it.metodo,
        it.ip_address,
        it.user_agent,
        it.resultado,
        it.nivel_criticidade,
        it.data_hora,
        JSON.stringify(it.metadata)
      ];

      const r = await db.query(query, vals);
      console.log('Inserted audit log id=', r.rows[0].id, 'acao=', it.acao);
    }

    console.log('Amostras inseridas com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao inserir amostras de audit_logs:', err);
    process.exit(1);
  }
}

run();
