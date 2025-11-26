-- RH-Master: init.sql
-- Arquivo limpo e consistente para uso acadêmico / desenvolvimento.

-- AVISO: os comandos DROP abaixo apagam dados. 
-- Remova-os se quiser preservar conteúdo existente.

 /*
DROP TABLE IF EXISTS folha_pagamento CASCADE;
DROP TABLE IF EXISTS registro_ponto CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS historico_usuario CASCADE;
DROP TABLE IF EXISTS beneficios CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS registro_ponto_historico CASCADE;
*/

-- ==============================
-- TABELA DE USUÁRIOS
-- ==============================
CREATE TABLE IF NOT EXISTS usuario (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(50) UNIQUE NOT NULL,
  empresa VARCHAR(100),
  salario NUMERIC(12,2) DEFAULT 0,
  idade INTEGER,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha VARCHAR(200) NOT NULL,
  cargo VARCHAR(50),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- HISTÓRICO DE ALTERAÇÕES DO USUÁRIO
-- ==============================
CREATE TABLE IF NOT EXISTS historico_usuario (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  campo_alterado VARCHAR(100),
  valor_antigo TEXT,
  valor_novo TEXT,
  alterado_por INTEGER,
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- DOCUMENTOS (UPLOADS)
-- ==============================
CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_arquivo VARCHAR(1024) NOT NULL,
  data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- REGISTRO DE PONTO
-- ==============================
CREATE TABLE IF NOT EXISTS registro_ponto (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  motivo TEXT
);

-- ==============================
-- HISTÓRICO DE REGISTROS DE PONTO
-- ==============================
CREATE TABLE IF NOT EXISTS registro_ponto_historico (
  id SERIAL PRIMARY KEY,
  registro_ponto_id INTEGER REFERENCES registro_ponto(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  tipo_antigo VARCHAR(50),
  data_hora_antigo TIMESTAMP,
  tipo_novo VARCHAR(50),
  data_hora_novo TIMESTAMP,
  alterado_por INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  motivo TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_registro_ponto_historico_registro 
  ON registro_ponto_historico(registro_ponto_id);

-- ==============================
-- FOLHA DE PAGAMENTO
-- ==============================
CREATE TABLE IF NOT EXISTS folha_pagamento (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  salario_base NUMERIC(12,2) DEFAULT 0,
  total_pontos INTEGER DEFAULT 0,
  valor NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pendente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (usuario_id, mes, ano)
);

-- ==============================
-- BENEFÍCIOS (VINCULADOS A USUÁRIOS)
-- ==============================
CREATE TABLE IF NOT EXISTS beneficios (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  valor NUMERIC(12,2) DEFAULT 0,
  descricao TEXT,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE, -- Pode ser NULL se o benefício for contínuo
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS idx_beneficios_usuario 
  ON beneficios(usuario_id);

-- ==============================
-- ÍNDICES BÁSICOS
-- ==============================
CREATE INDEX IF NOT EXISTS idx_usuario_email 
  ON usuario(email);

CREATE INDEX IF NOT EXISTS idx_registro_ponto_usuario_data 
  ON registro_ponto(usuario_id, data_hora);

-- ==============================
-- SOLICITAÇÕES DE FÉRIAS / LICENÇAS
-- ==============================
CREATE TABLE IF NOT EXISTS solicitacoes_licenca (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- 'ferias' ou 'licenca'
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  motivo TEXT,
  status VARCHAR(20) DEFAULT 'pendente', -- pendente, aprovado, recusado
  aprovado_por INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- TABELA DE AUDITORIA DE CÁLCULOS DE FÉRIAS
-- ==============================
CREATE TABLE IF NOT EXISTS ferias_calculos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  meses_trabalhados INTEGER NOT NULL,
  dias_ferias INTEGER NOT NULL,
  valor_ferias NUMERIC(12,2) NOT NULL,
  um_terco NUMERIC(12,2) NOT NULL,
  valor_total NUMERIC(12,2) NOT NULL,
  salario_referencia NUMERIC(12,2) DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_usuario ON solicitacoes_licenca(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes_licenca(status);

CREATE INDEX IF NOT EXISTS idx_documentos_usuario 
  ON documentos(usuario_id);

-- ==============================
-- PERMISSÕES DE DOCUMENTOS
-- ==============================
CREATE TABLE IF NOT EXISTS documento_permissao (
  documento_id INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  pode_visualizar BOOLEAN DEFAULT FALSE,
  pode_editar BOOLEAN DEFAULT FALSE,
  pode_excluir BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (documento_id, usuario_id)
);

-- ==============================
-- LOGS DE ACESSO A DOCUMENTOS
-- ==============================
CREATE TABLE IF NOT EXISTS logs_acesso (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  documento_id INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  acao VARCHAR(50) NOT NULL,
  resultado VARCHAR(20) NOT NULL,
  data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- NOTA
-- ==============================
-- Se o container Postgres/SQLite já tiver dados, este arquivo só será executado
-- automaticamente na criação do volume.
-- Para reaplicar em um DB existente, rode o SQL manualmente ou remova o volume (apaga dados).

-- ==============================
-- AGENDAMENTO DE RELATÓRIOS
-- ==============================
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255),
  report_type VARCHAR(100),
  formato VARCHAR(20) DEFAULT 'pdf',
  empresa VARCHAR(100),
  cron_expr TEXT,
  tipo_agendamento VARCHAR(50) DEFAULT 'recorrente', -- 'recorrente' | 'one-time' | 'first_business_day'
  start_at TIMESTAMP, -- usado para agendamento one-time
  emails TEXT[] DEFAULT ARRAY[]::TEXT[],
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_empresa ON scheduled_reports(empresa);

CREATE TABLE IF NOT EXISTS scheduled_report_logs (
  id SERIAL PRIMARY KEY,
  scheduled_report_id INTEGER REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  status VARCHAR(50), -- success, failed
  message TEXT,
  arquivo_caminho VARCHAR(1024),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- LOGS DE AUDITORIA E SEGURANÇA
-- ==============================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  usuario_nome VARCHAR(100),
  usuario_email VARCHAR(100),
  acao VARCHAR(100) NOT NULL, -- tipo da ação (ex: 'LOGIN', 'LOGOUT', 'CRIAR_USUARIO', 'EDITAR_SALARIO')
  categoria VARCHAR(50) NOT NULL, -- 'AUTENTICACAO', 'USUARIO', 'FOLHA', 'DOCUMENTO', 'RELATORIO', etc
  descricao TEXT, -- descrição detalhada da ação
  endpoint VARCHAR(255), -- rota acessada
  metodo VARCHAR(10), -- GET, POST, PUT, DELETE
  ip_address VARCHAR(45), -- suporta IPv4 e IPv6
  user_agent TEXT,
  resultado VARCHAR(20) DEFAULT 'SUCESSO', -- SUCESSO, FALHA, NEGADO
  dados_anteriores JSONB, -- estado anterior (para alterações)
  dados_novos JSONB, -- estado novo (para alterações)
  metadata JSONB, -- informações adicionais
  nivel_criticidade VARCHAR(20) DEFAULT 'BAIXO', -- BAIXO, MEDIO, ALTO, CRITICO
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hash_integridade VARCHAR(64) -- hash SHA-256 para garantir imutabilidade
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario ON audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_acao ON audit_logs(acao);
CREATE INDEX IF NOT EXISTS idx_audit_logs_categoria ON audit_logs(categoria);
CREATE INDEX IF NOT EXISTS idx_audit_logs_data_hora ON audit_logs(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resultado ON audit_logs(resultado);
CREATE INDEX IF NOT EXISTS idx_audit_logs_nivel ON audit_logs(nivel_criticidade);
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON audit_logs(categoria, acao, data_hora DESC);

-- Trigger para calcular hash de integridade (imutabilidade)
CREATE OR REPLACE FUNCTION calculate_audit_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hash_integridade := encode(
    digest(
      COALESCE(NEW.usuario_id::text, '') || '|' ||
      COALESCE(NEW.acao, '') || '|' ||
      COALESCE(NEW.categoria, '') || '|' ||
      COALESCE(NEW.descricao, '') || '|' ||
      COALESCE(NEW.data_hora::text, '') || '|' ||
      COALESCE(NEW.dados_anteriores::text, '') || '|' ||
      COALESCE(NEW.dados_novos::text, ''),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_hash_trigger
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_audit_hash();

-- Impedir UPDATE e DELETE em audit_logs (imutabilidade)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Logs de auditoria são imutáveis e não podem ser modificados ou excluídos';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER prevent_audit_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();

-- ==============================
-- TABELA DE INCIDENTES DE SEGURANÇA
-- Implementação da métrica: Taxa de Incidentes de Vazamento de Dados
-- ==============================
CREATE TABLE IF NOT EXISTS security_incidents (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL, -- 'VAZAMENTO_DADOS', 'ACESSO_NAO_AUTORIZADO', 'TENTATIVA_INVASAO', etc
  severidade VARCHAR(20) NOT NULL, -- 'BAIXA', 'MEDIA', 'ALTA', 'CRITICA'
  descricao TEXT NOT NULL,
  dados_afetados TEXT, -- Descrição dos dados que vazaram (sem incluir dados sensíveis)
  quantidade_registros INTEGER DEFAULT 0, -- Quantidade de registros afetados
  origem VARCHAR(100), -- Origem da detecção (ex: 'AUDITORIA_LOGS', 'MONITORAMENTO_MANUAL', 'ALERTA_SISTEMA')
  usuario_id INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  usuario_responsavel VARCHAR(100), -- Nome do usuário relacionado ao incidente
  endpoint VARCHAR(255), -- Endpoint relacionado
  ip_address VARCHAR(45), -- IP envolvido
  data_deteccao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_resolucao TIMESTAMP, -- Quando o incidente foi resolvido
  status VARCHAR(20) DEFAULT 'ABERTO', -- 'ABERTO', 'EM_INVESTIGACAO', 'RESOLVIDO', 'FALSO_POSITIVO'
  acao_corretiva TEXT, -- Ação tomada para resolver
  detectado_por INTEGER REFERENCES usuario(id) ON DELETE SET NULL, -- Quem detectou
  resolvido_por INTEGER REFERENCES usuario(id) ON DELETE SET NULL, -- Quem resolveu
  metadata JSONB, -- Informações adicionais
  audit_log_id INTEGER REFERENCES audit_logs(id) ON DELETE SET NULL -- Referência ao log de auditoria relacionado
);

-- Índices para otimizar consultas de métricas
CREATE INDEX IF NOT EXISTS idx_security_incidents_tipo ON security_incidents(tipo);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severidade ON security_incidents(severidade);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_data ON security_incidents(data_deteccao DESC);
CREATE INDEX IF NOT EXISTS idx_security_incidents_composite ON security_incidents(tipo, status, data_deteccao DESC);

-- ==============================
-- TABELA DE TRANSAÇÕES DE DADOS
-- Para calcular o total de transações (denominador da métrica)
-- ==============================
CREATE TABLE IF NOT EXISTS data_transactions (
  id SERIAL PRIMARY KEY,
  tipo_transacao VARCHAR(50) NOT NULL, -- 'CONSULTA', 'CRIACAO', 'ATUALIZACAO', 'EXCLUSAO', 'EXPORTACAO'
  categoria_dados VARCHAR(50) NOT NULL, -- 'USUARIO', 'FOLHA_PAGAMENTO', 'DOCUMENTO', 'BENEFICIO', etc
  quantidade_registros INTEGER DEFAULT 1, -- Quantidade de registros envolvidos na transação
  usuario_id INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  endpoint VARCHAR(255),
  sensibilidade VARCHAR(20) DEFAULT 'NORMAL', -- 'BAIXA', 'NORMAL', 'ALTA', 'CRITICA'
  data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  audit_log_id INTEGER REFERENCES audit_logs(id) ON DELETE CASCADE,
  metadata JSONB
);

-- Índices para contagem rápida de transações
CREATE INDEX IF NOT EXISTS idx_data_transactions_data ON data_transactions(data_transacao DESC);
CREATE INDEX IF NOT EXISTS idx_data_transactions_tipo ON data_transactions(tipo_transacao);
CREATE INDEX IF NOT EXISTS idx_data_transactions_categoria ON data_transactions(categoria_dados);

-- ==============================
-- TABELA DE REGRAS DE ACESSO POR PERFIL
-- Implementação da métrica: Cobertura de Regras de Acesso por Perfil
-- Fórmula: X = (Funcionalidades com RBAC / Total de funcionalidades com acesso restrito) × 100
-- ==============================
CREATE TABLE IF NOT EXISTS access_rules (
  id SERIAL PRIMARY KEY,
  perfil VARCHAR(50) NOT NULL, -- 'admin', 'colaborador', 'gerente', etc
  funcionalidade VARCHAR(100) NOT NULL, -- Nome da funcionalidade (ex: 'CADASTRAR_USUARIO', 'VER_FOLHA')
  endpoint VARCHAR(255), -- Endpoint da API relacionado
  metodo VARCHAR(10), -- GET, POST, PUT, DELETE
  tem_rbac BOOLEAN DEFAULT FALSE, -- Se tem controle de acesso implementado
  nivel_risco VARCHAR(20) DEFAULT 'MEDIO', -- BAIXO, MEDIO, ALTO, CRITICO
  descricao TEXT, -- Descrição da funcionalidade
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(perfil, funcionalidade)
);

CREATE INDEX IF NOT EXISTS idx_access_rules_perfil ON access_rules(perfil);
CREATE INDEX IF NOT EXISTS idx_access_rules_rbac ON access_rules(tem_rbac);
CREATE INDEX IF NOT EXISTS idx_access_rules_risco ON access_rules(nivel_risco);

-- ==============================
-- TABELAS DE PERFORMANCE METRICS - Task 1
-- ==============================

-- Tabela para armazenar as métricas de performance
CREATE TABLE IF NOT EXISTS performance_metrics (
  id SERIAL PRIMARY KEY,
  cpu_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  memoria_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  tempo_resposta_ms NUMERIC(7,2) NOT NULL DEFAULT 0,
  disponibilidade_percent NUMERIC(5,2) NOT NULL DEFAULT 100,
  uptime_segundos INTEGER NOT NULL DEFAULT 0,
  requisicoes_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para otimizar queries por data
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at 
  ON performance_metrics(created_at DESC);

COMMENT ON TABLE performance_metrics IS 'Armazena snapshots de métricas de performance da aplicação';
COMMENT ON COLUMN performance_metrics.cpu_percent IS 'Percentual de uso de CPU (0-100%)';
COMMENT ON COLUMN performance_metrics.memoria_percent IS 'Percentual de uso de memória heap do Node.js (0-100%)';
COMMENT ON COLUMN performance_metrics.tempo_resposta_ms IS 'Tempo médio de resposta em milissegundos';
COMMENT ON COLUMN performance_metrics.disponibilidade_percent IS 'Percentual de disponibilidade (0-100%)';
COMMENT ON COLUMN performance_metrics.uptime_segundos IS 'Tempo de uptime em segundos';
COMMENT ON COLUMN performance_metrics.requisicoes_total IS 'Total de requisições processadas até este ponto';

-- ==============================
-- TABELA DE ALERTAS DE PERFORMANCE - Task 2
-- ==============================

CREATE TABLE IF NOT EXISTS performance_alerts (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL, -- CPU_ELEVADA, MEMORIA_ELEVADA, TEMPO_RESPOSTA_ELEVADO, DISPONIBILIDADE_BAIXA
  severidade VARCHAR(20) NOT NULL, -- BAIXA, MEDIA, ALTA, CRITICA
  mensagem TEXT NOT NULL,
  recurso VARCHAR(50), -- CPU, MEMORIA, TEMPO_RESPOSTA, DISPONIBILIDADE
  valor NUMERIC(7,2), -- Valor atual que disparou o alerta
  usuario_id INTEGER REFERENCES usuario(id) ON DELETE SET NULL, -- Usuário que detectou/reportou
  status VARCHAR(30) DEFAULT 'ABERTO', -- ABERTO, EM_INVESTIGACAO, RESOLVIDO, FALSO_POSITIVO
  notas TEXT, -- Notas sobre a resolução
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimizar queries
CREATE INDEX IF NOT EXISTS idx_performance_alerts_tipo ON performance_alerts(tipo);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severidade ON performance_alerts(severidade);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_status ON performance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_created_at ON performance_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_recurso ON performance_alerts(recurso);

-- Comentários
COMMENT ON TABLE performance_alerts IS 'Armazena alertas de degradação de performance da aplicação';
COMMENT ON COLUMN performance_alerts.tipo IS 'Tipo de alerta disparado (CPU_ELEVADA, MEMORIA_ELEVADA, TEMPO_RESPOSTA_ELEVADO, etc)';
COMMENT ON COLUMN performance_alerts.severidade IS 'Nível de severidade do alerta (BAIXA, MEDIA, ALTA, CRITICA)';
COMMENT ON COLUMN performance_alerts.recurso IS 'Recurso afetado (CPU, MEMORIA, TEMPO_RESPOSTA, DISPONIBILIDADE)';
COMMENT ON COLUMN performance_alerts.status IS 'Status do alerta (ABERTO, EM_INVESTIGACAO, RESOLVIDO, FALSO_POSITIVO)';

-- ==============================
-- TABELA DE EVENT LOGS - RNF-03
-- Observabilidade do Sistema: Rastreamento Imutável de Eventos Críticos
-- ==============================

CREATE TABLE IF NOT EXISTS event_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  tipo_evento VARCHAR(100) NOT NULL, -- 'USUARIO_CRIADO', 'USUARIO_ATUALIZADO', 'USUARIO_DELETADO', 
                                     -- 'FOLHA_CRIADA', 'FOLHA_ATUALIZADA', 'FOLHA_DELETADA',
                                     -- 'FERIAS_CRIADAS', 'FERIAS_ATUALIZADAS', 'FERIAS_DELETADAS',
                                     -- 'FERIAS_APROVADAS', 'FERIAS_REJEITADAS',
                                     -- 'LOGIN', 'LOGOUT', 'ACESSO_NEGADO', 'ALERTA_CRITICO'
  usuario_id INTEGER REFERENCES usuario(id) ON DELETE SET NULL,
  usuario_nome VARCHAR(100),
  usuario_email VARCHAR(100),
  endereco_ip VARCHAR(45),
  user_agent TEXT,
  detalhes JSONB, -- Informações detalhadas do evento
  status VARCHAR(30) DEFAULT 'REGISTRADO', -- 'REGISTRADO', 'ALERTADO', 'RESOLVIDO'
  nivel_criticidade VARCHAR(20) DEFAULT 'NORMAL', -- 'NORMAL', 'IMPORTANTE', 'CRITICO'
  hash_integridade VARCHAR(64), -- SHA-256 para garantir imutabilidade
  metadata JSONB -- Dados adicionais contextuais
);

-- Índices para otimizar queries de event logs
CREATE INDEX IF NOT EXISTS idx_event_logs_timestamp ON event_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_tipo_evento ON event_logs(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_event_logs_usuario_id ON event_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_nivel_criticidade ON event_logs(nivel_criticidade);
CREATE INDEX IF NOT EXISTS idx_event_logs_status ON event_logs(status);
CREATE INDEX IF NOT EXISTS idx_event_logs_composite ON event_logs(tipo_evento, nivel_criticidade, timestamp DESC);

-- Trigger para calcular hash de integridade para event_logs
CREATE OR REPLACE FUNCTION calculate_event_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hash_integridade := encode(
    digest(
      COALESCE(NEW.usuario_id::text, '') || '|' ||
      COALESCE(NEW.tipo_evento, '') || '|' ||
      COALESCE(NEW.timestamp::text, '') || '|' ||
      COALESCE(NEW.detalhes::text, '') || '|' ||
      COALESCE(NEW.nivel_criticidade, ''),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_logs_hash_trigger
  BEFORE INSERT ON event_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_event_hash();

-- Trigger para impedir UPDATE e DELETE em event_logs (imutabilidade)
CREATE OR REPLACE FUNCTION prevent_event_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Event logs são imutáveis e não podem ser modificados ou excluídos';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_event_update
  BEFORE UPDATE ON event_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_event_modification();

CREATE TRIGGER prevent_event_delete
  BEFORE DELETE ON event_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_event_modification();

COMMENT ON TABLE event_logs IS 'Rastreamento imutável de eventos críticos do sistema para observabilidade';
COMMENT ON COLUMN event_logs.tipo_evento IS 'Classificação do evento (ex: USUARIO_CRIADO, FOLHA_DELETADA, FERIAS_APROVADAS)';
COMMENT ON COLUMN event_logs.timestamp IS 'Hora exata do evento';
COMMENT ON COLUMN event_logs.nivel_criticidade IS 'NORMAL: operações rotineiras, IMPORTANTE: alterações significativas, CRITICO: ações sensíveis';
COMMENT ON COLUMN event_logs.hash_integridade IS 'SHA-256 para verificar integridade e detectar manipulações';
