-- RH-Master: init.sql
-- Arquivo limpo e consistente para uso acadêmico / desenvolvimento.

-- AVISO: os comandos DROP abaixo apagam dados. Remova-os se quiser preservar conteúdo.

/*
DROP TABLE IF EXISTS folha_pagamento CASCADE;
DROP TABLE IF EXISTS registro_ponto CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS historico_usuario CASCADE;
DROP TABLE IF EXISTS usuario CASCADE; 
*/

-- Tabela de usuários
CREATE TABLE usuario (
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

-- Histórico de alterações do usuário
CREATE TABLE historico_usuario (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  campo_alterado VARCHAR(100),
  valor_antigo TEXT,
  valor_novo TEXT,
  alterado_por INTEGER,
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de documentos (uploads)
CREATE TABLE documentos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_arquivo VARCHAR(1024) NOT NULL,
  data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de registros de ponto
CREATE TABLE registro_ponto (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  motivo TEXT
);

-- Tabela de folha de pagamento (simplificada)
CREATE TABLE folha_pagamento (
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

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_registro_ponto_usuario_data ON registro_ponto(usuario_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_documentos_usuario ON documentos(usuario_id);

-- Nota: se o container Postgres já tiver dados, este arquivo só será executado
-- automaticamente na criação do volume. Para reaplicar em um DB existente,
-- rode o SQL manualmente dentro do container ou remova o volume (apaga dados).

-- Tabela de auditoria para alterações em registros de ponto
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

CREATE INDEX IF NOT EXISTS idx_registro_ponto_historico_registro ON registro_ponto_historico(registro_ponto_id);
