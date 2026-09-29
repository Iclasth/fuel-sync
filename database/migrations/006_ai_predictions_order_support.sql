-- ==============================================================================
-- Migration 006: Suporte a Previsões de IA Vinculadas Diretamente ao Pedido
-- Permite que estimativas de ETA sejam geradas desde o status PENDENTE/EM_PREPARACAO,
-- antes da criação do registro operacional na tabela 'entregas'.
-- ==============================================================================

-- 1. Adicionar pedido_id na tabela previsoes_ia vinculada à tabela pedidos
ALTER TABLE previsoes_ia 
    ADD COLUMN IF NOT EXISTS pedido_id BIGINT REFERENCES pedidos(id) ON DELETE CASCADE;

-- 2. Tornar entrega_id opcional (DROP NOT NULL)
ALTER TABLE previsoes_ia 
    ALTER COLUMN entrega_id DROP NOT NULL;

-- 3. Expandir tamanho do campo de fator_principal_risco para até 255 caracteres
ALTER TABLE previsoes_ia 
    ALTER COLUMN fator_principal_risco TYPE VARCHAR(255);

-- 4. Índice de performance para buscas de previsões por pedido ordenadas por data
CREATE INDEX IF NOT EXISTS idx_previsoes_pedido 
    ON previsoes_ia (pedido_id, criado_em DESC);
