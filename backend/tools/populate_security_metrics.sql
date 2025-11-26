-- Script SQL para popular dados de métricas de segurança
-- Pode ser executado diretamente no PostgreSQL

-- 1. Limpar dados antigos (opcional)
TRUNCATE TABLE data_transactions CASCADE;
TRUNCATE TABLE security_incidents CASCADE;
TRUNCATE TABLE access_rules CASCADE;

-- 2. Popular transações de dados (960 transações)
DO $$
DECLARE
    i INTEGER;
BEGIN
    -- 500 consultas normais (baixa sensibilidade)
    FOR i IN 1..500 LOOP
        INSERT INTO data_transactions (tipo_transacao, categoria_dados, quantidade_registros, sensibilidade, data_transacao)
        VALUES ('CONSULTA', 'USUARIO', 1, 'BAIXA', NOW() - (RANDOM() * INTERVAL '30 days'));
    END LOOP;

    -- 200 operações em documentos (alta sensibilidade)
    FOR i IN 1..200 LOOP
        INSERT INTO data_transactions (tipo_transacao, categoria_dados, quantidade_registros, sensibilidade, data_transacao)
        VALUES ('CONSULTA', 'DOCUMENTO', 1, 'ALTA', NOW() - (RANDOM() * INTERVAL '30 days'));
    END LOOP;

    -- 100 operações em folha de pagamento (crítica)
    FOR i IN 1..100 LOOP
        INSERT INTO data_transactions (tipo_transacao, categoria_dados, quantidade_registros, sensibilidade, data_transacao)
        VALUES ('CONSULTA', 'FOLHA_PAGAMENTO', 1, 'CRITICA', NOW() - (RANDOM() * INTERVAL '30 days'));
    END LOOP;

    -- 50 criações
    FOR i IN 1..50 LOOP
        INSERT INTO data_transactions (tipo_transacao, categoria_dados, quantidade_registros, sensibilidade, data_transacao)
        VALUES ('CRIACAO', 'USUARIO', 1, 'ALTA', NOW() - (RANDOM() * INTERVAL '30 days'));
    END LOOP;

    -- 80 atualizações
    FOR i IN 1..80 LOOP
        INSERT INTO data_transactions (tipo_transacao, categoria_dados, quantidade_registros, sensibilidade, data_transacao)
        VALUES ('ATUALIZACAO', 'BENEFICIO', 1, 'ALTA', NOW() - (RANDOM() * INTERVAL '30 days'));
    END LOOP;

    -- 30 exportações
    FOR i IN 1..30 LOOP
        INSERT INTO data_transactions (tipo_transacao, categoria_dados, quantidade_registros, sensibilidade, data_transacao)
        VALUES ('EXPORTACAO', 'RELATORIO', FLOOR(RANDOM() * 50 + 1)::INTEGER, 'MEDIA', NOW() - (RANDOM() * INTERVAL '30 days'));
    END LOOP;
END $$;

-- 3. Popular incidentes de segurança (6 incidentes)
INSERT INTO security_incidents (tipo, severidade, descricao, dados_afetados, quantidade_registros, origem, status, acao_corretiva, data_deteccao, data_resolucao) VALUES
('VAZAMENTO_DADOS', 'ALTA', 'Acesso não autorizado a dados de colaboradores detectado via log de auditoria', 'Dados pessoais de 15 colaboradores', 15, 'AUDITORIA_AUTOMATICA', 'RESOLVIDO', 'Permissões corrigidas e usuários notificados. Senha do sistema alterada.', NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days'),
('TENTATIVAS_FALHAS_AUTENTICACAO', 'MEDIA', 'Múltiplas tentativas de login com credenciais inválidas', NULL, 0, 'AUDITORIA_AUTOMATICA', 'RESOLVIDO', 'IP bloqueado temporariamente. Conta do usuário verificada.', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),
('ACESSO_NAO_AUTORIZADO', 'MEDIA', 'Tentativa de acesso a endpoint restrito sem permissão adequada', NULL, 0, 'MONITORAMENTO_MANUAL', 'FALSO_POSITIVO', 'Verificado que era um erro de configuração do cliente.', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days'),
('VAZAMENTO_DADOS', 'CRITICA', 'Documento com dados salariais compartilhado incorretamente', 'Dados salariais de 50 colaboradores', 50, 'RELATO_USUARIO', 'RESOLVIDO', 'Documento removido, acesso revisado, colaboradores notificados conforme LGPD.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('VAZAMENTO_DADOS', 'ALTA', 'Exportação massiva de dados detectada fora do horário comercial', 'Lista completa de colaboradores com dados de contato', 200, 'AUDITORIA_AUTOMATICA', 'EM_INVESTIGACAO', NULL, NOW() - INTERVAL '1 day', NULL),
('ACESSO_NAO_AUTORIZADO', 'BAIXA', 'Tentativa de acesso a documentos de outro departamento', NULL, 0, 'AUDITORIA_LOGS', 'ABERTO', NULL, NOW(), NULL);

-- 4. Popular regras de acesso por perfil (29 regras)
INSERT INTO access_rules (perfil, funcionalidade, endpoint, metodo, tem_rbac, nivel_risco, descricao) VALUES
-- Admin - Todas com RBAC
('admin', 'CADASTRAR_USUARIO', '/api/usuario', 'POST', true, 'ALTO', 'Criar novos usuários no sistema'),
('admin', 'LISTAR_USUARIOS', '/api/usuario/lista', 'GET', true, 'MEDIO', 'Visualizar lista de todos os usuários'),
('admin', 'EDITAR_USUARIO', '/api/usuario/:id', 'PUT', true, 'ALTO', 'Editar dados de usuários'),
('admin', 'GERAR_RELATORIO_FOLHA', '/api/relatorios/folha', 'GET', true, 'CRITICO', 'Gerar relatório de folha de pagamento'),
('admin', 'GERAR_RELATORIO_PRESENCA', '/api/relatorios/presenca', 'GET', true, 'MEDIO', 'Gerar relatório de presença'),
('admin', 'APROVAR_SOLICITACAO', '/api/solicitacoes/:id/decidir', 'PUT', true, 'ALTO', 'Aprovar ou recusar solicitações'),
('admin', 'GERENCIAR_BENEFICIOS', '/api/beneficios', 'POST', true, 'ALTO', 'Criar e gerenciar benefícios'),
('admin', 'VISUALIZAR_AUDIT_LOGS', '/api/audit/logs', 'GET', true, 'MEDIO', 'Visualizar logs de auditoria'),
('admin', 'CALCULAR_FERIAS', '/api/ferias/calcular', 'POST', true, 'ALTO', 'Calcular valores de férias'),
('admin', 'AGENDAR_RELATORIOS', '/api/schedules', 'POST', true, 'MEDIO', 'Agendar geração automática de relatórios'),

-- Colaborador - Mix de com/sem RBAC
('colaborador', 'VER_PERFIL_PROPRIO', '/api/usuario/me', 'GET', true, 'BAIXO', 'Visualizar próprio perfil'),
('colaborador', 'EDITAR_PERFIL_PROPRIO', '/api/usuario/:id', 'PUT', true, 'MEDIO', 'Editar próprio perfil'),
('colaborador', 'REGISTRAR_PONTO', '/api/registro-ponto', 'POST', true, 'MEDIO', 'Registrar entrada/saída'),
('colaborador', 'VER_PONTOS_PROPRIOS', '/api/registro-ponto', 'GET', true, 'BAIXO', 'Ver registros de ponto próprios'),
('colaborador', 'SOLICITAR_FERIAS', '/api/solicitacoes', 'POST', true, 'MEDIO', 'Solicitar férias ou licença'),
('colaborador', 'VER_SOLICITACOES_PROPRIAS', '/api/solicitacoes/:usuarioId', 'GET', true, 'BAIXO', 'Ver próprias solicitações'),
('colaborador', 'UPLOAD_DOCUMENTOS', '/api/documentos/upload', 'POST', false, 'ALTO', 'Upload de documentos pessoais'),
('colaborador', 'VER_FOLHA_PROPRIA', '/api/folha/:usuarioId', 'GET', false, 'CRITICO', 'Visualizar própria folha de pagamento'),
('colaborador', 'VER_BENEFICIOS_PROPRIOS', '/api/beneficios/:usuarioId', 'GET', true, 'MEDIO', 'Ver benefícios próprios'),

-- Gerente - Maioria sem RBAC (precisa implementar)
('gerente', 'VER_EQUIPE', '/api/usuario/equipe', 'GET', false, 'MEDIO', 'Visualizar usuários da equipe'),
('gerente', 'APROVAR_FERIAS_EQUIPE', '/api/solicitacoes/:id/aprovar', 'PUT', false, 'ALTO', 'Aprovar férias da equipe'),
('gerente', 'VER_PONTOS_EQUIPE', '/api/registro-ponto/equipe', 'GET', false, 'MEDIO', 'Ver pontos da equipe'),
('gerente', 'GERAR_RELATORIO_EQUIPE', '/api/relatorios/equipe', 'GET', false, 'ALTO', 'Gerar relatórios da equipe'),
('gerente', 'EDITAR_PONTO_EQUIPE', '/api/registro-ponto/:id', 'PUT', false, 'ALTO', 'Editar registros de ponto da equipe'),

-- RH - Maioria sem RBAC (precisa implementar)
('rh', 'CADASTRAR_COLABORADOR', '/api/usuario', 'POST', false, 'ALTO', 'Cadastrar novos colaboradores'),
('rh', 'GERENCIAR_BENEFICIOS_GERAL', '/api/beneficios', 'POST', false, 'ALTO', 'Gerenciar benefícios de todos'),
('rh', 'PROCESSAR_FOLHA', '/api/folha/processar', 'POST', false, 'CRITICO', 'Processar folha de pagamento'),
('rh', 'VER_TODAS_SOLICITACOES', '/api/solicitacoes', 'GET', true, 'MEDIO', 'Visualizar todas as solicitações'),
('rh', 'GERAR_RELATORIO_RH', '/api/relatorios/rh', 'GET', false, 'ALTO', 'Gerar relatórios de RH');

-- 5. Exibir resultados
\echo '═══════════════════════════════════════════════════════════'
\echo '           DADOS POPULADOS COM SUCESSO!'
\echo '═══════════════════════════════════════════════════════════'

-- Estatísticas de transações
SELECT 
    '📊 TRANSAÇÕES' as categoria,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE tipo_transacao = 'CONSULTA') as consultas,
    COUNT(*) FILTER (WHERE tipo_transacao = 'CRIACAO') as criacoes,
    COUNT(*) FILTER (WHERE tipo_transacao = 'ATUALIZACAO') as atualizacoes,
    COUNT(*) FILTER (WHERE tipo_transacao = 'EXPORTACAO') as exportacoes
FROM data_transactions;

-- Estatísticas de incidentes
SELECT 
    '🚨 INCIDENTES' as categoria,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE tipo = 'VAZAMENTO_DADOS') as vazamentos,
    COUNT(*) FILTER (WHERE severidade IN ('CRITICA', 'ALTA')) as criticos_altos,
    COUNT(*) FILTER (WHERE status = 'ABERTO') as abertos,
    COUNT(*) FILTER (WHERE status = 'RESOLVIDO') as resolvidos
FROM security_incidents;

-- Estatísticas de regras de acesso
SELECT 
    '🔐 REGRAS DE ACESSO' as categoria,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE tem_rbac = true) as com_rbac,
    COUNT(*) FILTER (WHERE tem_rbac = false) as sem_rbac,
    ROUND((COUNT(*) FILTER (WHERE tem_rbac = true)::NUMERIC / COUNT(*)) * 100, 2) as cobertura_pct
FROM access_rules;

-- Métricas calculadas
\echo ''
\echo '═══════════════════════════════════════════════════════════'
\echo '                    MÉTRICAS CALCULADAS'
\echo '═══════════════════════════════════════════════════════════'

-- Taxa de Proteção de Dados
WITH 
    transacoes AS (SELECT COUNT(*) as total FROM data_transactions),
    incidentes AS (SELECT COUNT(*) as total FROM security_incidents WHERE tipo = 'VAZAMENTO_DADOS')
SELECT 
    '📈 Taxa de Proteção de Dados' as metrica,
    t.total as total_transacoes,
    i.total as total_incidentes,
    ROUND(100 - (i.total::numeric / NULLIF(t.total, 0) * 100), 2) || '%' as taxa_protecao
FROM transacoes t, incidentes i;

-- Cobertura de RBAC
SELECT 
    '🔒 Cobertura de RBAC' as metrica,
    COUNT(*) as total_funcionalidades,
    SUM(CASE WHEN tem_rbac THEN 1 ELSE 0 END) as com_rbac,
    ROUND((SUM(CASE WHEN tem_rbac THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) || '%' as cobertura
FROM access_rules;

\echo ''
\echo '✅ Dados prontos para teste!'
\echo '🚀 Acesse: http://localhost:3001/api/security-metrics/taxa-vazamento'
\echo '🚀 Acesse: http://localhost:3001/api/security-metrics/cobertura-acesso'
\echo ''
