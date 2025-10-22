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