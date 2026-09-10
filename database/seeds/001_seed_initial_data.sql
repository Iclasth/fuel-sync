-- ==============================================================================
-- Seed: 001_seed_initial_data.sql
-- Dados iniciais de combustíveis e posto de demonstração para desenvolvimento
-- ==============================================================================

-- 1. Catálogo de Combustíveis Padrão
INSERT INTO combustiveis (nome, unidade_medida) VALUES
    ('Gasolina Comum', 'LITROS'),
    ('Gasolina Podium', 'LITROS'),
    ('Diesel Náutico S10', 'LITROS'),
    ('Etanol Hidratado', 'LITROS')
ON CONFLICT (nome) DO NOTHING;

-- 2. Posto Piloto de Demonstração
INSERT INTO postos (
    nome_fantasia,
    razao_social,
    cnpj,
    telefone,
    endereco,
    latitude,
    longitude,
    tempo_medio_preparo_minutos,
    ativo
) VALUES (
    'Posto Náutico & Marina Marina Imperial',
    'Auto Posto Náutico Imperial Ltda',
    '12.345.678/0001-99',
    '(21) 3333-4444',
    'Av. Infante Dom Henrique, s/n - Glória, Rio de Janeiro - RJ',
    -22.920800,
    -43.172900,
    15,
    TRUE
) ON CONFLICT (cnpj) DO NOTHING;
