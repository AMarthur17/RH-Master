-- Cria tabela sensitive_events e popula com eventos sensíveis baseados em ACOES_SENSIVEIS

CREATE TABLE IF NOT EXISTS sensitive_events (
  event_key VARCHAR(100) PRIMARY KEY,
  descricao TEXT,
  categoria VARCHAR(50),
  nivel_criticidade VARCHAR(20),
  ativo BOOLEAN DEFAULT TRUE
);

-- Inserir eventos sensíveis iniciais (baseado em backend/src/middleware/audit.js)
INSERT INTO sensitive_events (event_key, descricao, categoria, nivel_criticidade, ativo) VALUES
('LOGIN', 'Tentativa de login', 'AUTENTICACAO', 'MEDIO', TRUE),
('LOGOUT', 'Logout de usuário', 'AUTENTICACAO', 'BAIXO', TRUE),
('CRIAR_USUARIO', 'Criação de usuário', 'USUARIO', 'ALTO', TRUE),
('EDITAR_USUARIO', 'Edição de usuário', 'USUARIO', 'ALTO', TRUE),
('EXCLUIR_USUARIO', 'Exclusão de usuário', 'USUARIO', 'CRITICO', TRUE),
('CRIAR_FOLHA_PAGAMENTO', 'Criação de folha de pagamento', 'FOLHA_PAGAMENTO', 'CRITICO', TRUE),
('EDITAR_FOLHA_PAGAMENTO', 'Edição de folha de pagamento', 'FOLHA_PAGAMENTO', 'CRITICO', TRUE),
('EXCLUIR_FOLHA_PAGAMENTO', 'Exclusão de folha de pagamento', 'FOLHA_PAGAMENTO', 'CRITICO', TRUE),
('CRIAR_BENEFICIO', 'Criação de benefício', 'BENEFICIO', 'ALTO', TRUE),
('EDITAR_BENEFICIO', 'Edição de benefício', 'BENEFICIO', 'ALTO', TRUE),
('EXCLUIR_BENEFICIO', 'Exclusão de benefício', 'BENEFICIO', 'ALTO', TRUE),
('UPLOAD_DOCUMENTO', 'Upload de documento', 'DOCUMENTO', 'MEDIO', TRUE),
('VISUALIZAR_DOCUMENTO', 'Visualização de documento', 'DOCUMENTO', 'BAIXO', TRUE),
('EXCLUIR_DOCUMENTO', 'Exclusão de documento', 'DOCUMENTO', 'ALTO', TRUE),
('GERAR_RELATORIO', 'Geração de relatório', 'RELATORIO', 'MEDIO', TRUE),
('CONSULTAR_RELATORIO_FOLHA', 'Consulta relatório folha', 'RELATORIO', 'MEDIO', TRUE),
('CRIAR_SOLICITACAO', 'Criação de solicitação', 'SOLICITACAO', 'MEDIO', TRUE),
('APROVAR_SOLICITACAO', 'Aprovação de solicitação', 'SOLICITACAO', 'ALTO', TRUE),
('REJEITAR_SOLICITACAO', 'Rejeição de solicitação', 'SOLICITACAO', 'ALTO', TRUE),
('SOLICITAR_FERIAS', 'Solicitação de férias', 'FERIAS', 'MEDIO', TRUE),
('APROVAR_FERIAS', 'Aprovação de férias', 'FERIAS', 'ALTO', TRUE),
('REGISTRAR_PONTO', 'Registro de ponto', 'PONTO', 'BAIXO', TRUE),
('EDITAR_PONTO', 'Edição de ponto', 'PONTO', 'ALTO', TRUE),
('EXCLUIR_PONTO', 'Exclusão de ponto', 'PONTO', 'CRITICO', TRUE)
ON CONFLICT (event_key) DO NOTHING;
