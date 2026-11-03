-- ==============================================================================
-- Migration 007: Baseline de Horário de Entrega e Suporte a Filas por Posto
-- Registra o marco oficial de estimativa de entrega (baseline) no momento do
-- aceite pelo posto (CONFIRMADO_POSTO) para cálculo de atrasos subsequentes.
-- ==============================================================================

-- 1. Adicionar colunas de baseline na tabela pedidos
ALTER TABLE pedidos 
    ADD COLUMN IF NOT EXISTS horario_previsto_entrega TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS tempo_estimado_entrega_minutos INTEGER;

-- 2. Índice otimizado para contagem rápida de filas operacionais por posto e status
CREATE INDEX IF NOT EXISTS idx_pedidos_posto_status 
    ON pedidos (posto_id, status);
