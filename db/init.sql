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
