-- ==============================================================================
-- Migration: 005_order_courier_assignment.sql
-- Descrição: Associação direta de entregador responsável ao pedido e índices
-- ==============================================================================

-- 1. Adição da chave estrangeira entregador_id na tabela pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS entregador_id INTEGER REFERENCES entregadores(id) ON DELETE SET NULL;

-- 2. Índice de performance para consultas por entregador
CREATE INDEX IF NOT EXISTS idx_pedidos_entregador_id ON pedidos(entregador_id);
