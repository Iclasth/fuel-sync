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
    'Marina & Abastecimento Oceano Azul',
    'Abastecedora Marítima Oceano Azul Ltda',
    '98.765.432/0001-11',
    '(24) 3365-1122',
    'Estrada do Contorno, 1500 - Angra dos Reis - RJ',
    -23.006700,
    -44.318900,
    20,
    TRUE
) ON CONFLICT (cnpj) DO NOTHING;

-- 3. Combustíveis e Preços dos Postos Piloto
INSERT INTO posto_combustiveis (
    posto_id,
    combustivel_id,
    preco_litro,
    estoque_litros,
    disponivel
)
SELECT
    p.id AS posto_id,
    c.id AS combustivel_id,
    CASE 
        WHEN p.cnpj = '12.345.678/0001-99' AND c.nome = 'Gasolina Comum' THEN 5.89
        WHEN p.cnpj = '12.345.678/0001-99' AND c.nome = 'Gasolina Podium' THEN 7.15
        WHEN p.cnpj = '12.345.678/0001-99' AND c.nome = 'Diesel Náutico S10' THEN 6.25
        WHEN p.cnpj = '12.345.678/0001-99' AND c.nome = 'Etanol Hidratado' THEN 4.39
        WHEN p.cnpj = '98.765.432/0001-11' AND c.nome = 'Gasolina Comum' THEN 5.95
        WHEN p.cnpj = '98.765.432/0001-11' AND c.nome = 'Gasolina Podium' THEN 7.29
        WHEN p.cnpj = '98.765.432/0001-11' AND c.nome = 'Diesel Náutico S10' THEN 6.35
        WHEN p.cnpj = '98.765.432/0001-11' AND c.nome = 'Etanol Hidratado' THEN 4.45
        ELSE 5.99
    END AS preco_litro,
    CASE 
        WHEN c.nome = 'Gasolina Comum' THEN 15000.00
        WHEN c.nome = 'Gasolina Podium' THEN 8000.00
        WHEN c.nome = 'Diesel Náutico S10' THEN 20000.00
        WHEN c.nome = 'Etanol Hidratado' THEN 10000.00
        ELSE 5000.00
    END AS estoque_litros,
    TRUE AS disponivel
FROM postos p
CROSS JOIN combustiveis c
WHERE p.cnpj IN ('12.345.678/0001-99', '98.765.432/0001-11')
ON CONFLICT (posto_id, combustivel_id) DO UPDATE SET
    preco_litro = EXCLUDED.preco_litro,
    estoque_litros = EXCLUDED.estoque_litros,
    disponivel = EXCLUDED.disponivel;

-- 4. Entregadores Piloto Homologados
INSERT INTO entregadores (
    posto_id,
    nome,
    cpf,
    telefone,
    veiculo_descricao,
    placa,
    status
)
SELECT
    p.id,
    'Carlos Santos (Operador Náutico)',
    '52998224725',
    '(21) 98765-4321',
    'Furgão com Tanque Certificado INMETRO',
    'BRA2E19',
    'DISPONIVEL'
FROM postos p
WHERE p.cnpj = '12.345.678/0001-99'
ON CONFLICT (cpf) DO NOTHING;

INSERT INTO entregadores (
    posto_id,
    nome,
    cpf,
    telefone,
    veiculo_descricao,
    placa,
    status
)
SELECT
    p.id,
    'Rodrigo Lima (Operador Marítimo)',
    '83421987502',
    '(24) 99876-5432',
    'Lancha Rápida de Apoio e Abastecimento',
    'ANG9911',
    'DISPONIVEL'
FROM postos p
WHERE p.cnpj = '98.765.432/0001-11'
ON CONFLICT (cpf) DO NOTHING;

