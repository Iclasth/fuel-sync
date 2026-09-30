-- ==============================================================================
-- Migration: 003_client_delivery_locations.sql
-- Descrição: Tabela relacional de múltiplos locais e pontos de abastecimento do cliente
-- ==============================================================================

CREATE TABLE IF NOT EXISTS locais_entrega_cliente (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    apelido VARCHAR(120) NOT NULL,
    tipo_local VARCHAR(30) NOT NULL CHECK (tipo_local IN ('MARINA', 'CONDOMINIO', 'CHACARA', 'RODOVIA', 'RESIDENCIA', 'OUTRO')),
    endereco VARCHAR(255) NOT NULL,
    ponto_referencia VARCHAR(150),
    latitude DECIMAL(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DECIMAL(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    padrao BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locais_entrega_cliente_id 
    ON locais_entrega_cliente(cliente_id);

GRANT ALL ON TABLE locais_entrega_cliente TO postgres, anon, authenticated, service_role;
ALTER TABLE locais_entrega_cliente DISABLE ROW LEVEL SECURITY;
