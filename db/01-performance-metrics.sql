-- ============================================
-- Tabelas para Performance Metrics - Task 1
-- ============================================

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

-- Comentários nas colunas
COMMENT ON TABLE performance_metrics IS 'Armazena snapshots de métricas de performance da aplicação';
COMMENT ON COLUMN performance_metrics.cpu_percent IS 'Percentual de uso de CPU (0-100%)';
COMMENT ON COLUMN performance_metrics.memoria_percent IS 'Percentual de uso de memória heap do Node.js (0-100%)';
COMMENT ON COLUMN performance_metrics.tempo_resposta_ms IS 'Tempo médio de resposta em milissegundos';
COMMENT ON COLUMN performance_metrics.disponibilidade_percent IS 'Percentual de disponibilidade (0-100%)';
COMMENT ON COLUMN performance_metrics.uptime_segundos IS 'Tempo de uptime em segundos';
COMMENT ON COLUMN performance_metrics.requisicoes_total IS 'Total de requisições processadas até este ponto';
