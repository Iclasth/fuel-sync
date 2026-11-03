-- ==============================================================================
-- Migration: 001_initial_b2c_schema.sql
-- Descrição: Esquema inicial para o modelo B2C de entrega fracionada de combustível
-- Ciclo Logístico: Posto -> Cliente -> Posto (Hub-and-Spoke)
-- ==============================================================================

-- 1. Tabela de Perfis de Usuários (Vinculada ao Supabase Auth)
CREATE TABLE IF NOT EXISTS perfis_usuarios (
    id UUID PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    nome VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('cliente', 'posto_admin', 'entregador')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Postos de Combustível (Bases Operacionais)
CREATE TABLE IF NOT EXISTS postos (
    id SERIAL PRIMARY KEY,
    nome_fantasia VARCHAR(150) NOT NULL,
    razao_social VARCHAR(150),
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DECIMAL(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    tempo_medio_preparo_minutos INTEGER DEFAULT 12 CHECK (tempo_medio_preparo_minutos >= 0),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Clientes Civis (Consumidores B2C)
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    usuario_id UUID UNIQUE,
    nome VARCHAR(120) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    endereco_padrao VARCHAR(255),
    ponto_referencia_padrao VARCHAR(150), -- Ex: "Marina da Glória, Píer B, Vaga 14"
    latitude DECIMAL(9,6) CHECK (latitude BETWEEN -90 AND 90),
    longitude DECIMAL(9,6) CHECK (longitude BETWEEN -180 AND 180),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Entregadores Credenciados do Posto
CREATE TABLE IF NOT EXISTS entregadores (
    id SERIAL PRIMARY KEY,
    usuario_id UUID UNIQUE,
    posto_id INTEGER NOT NULL REFERENCES postos(id) ON DELETE RESTRICT,
    nome VARCHAR(120) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    veiculo_descricao VARCHAR(80) NOT NULL, -- Ex: "Furgão Utilitário com Tanque Homologado"
    placa VARCHAR(10) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DISPONIVEL' CHECK (status IN ('DISPONIVEL', 'EM_ROTA', 'INDISPONIVEL')),
    ultima_latitude DECIMAL(9,6) CHECK (ultima_latitude IS NULL OR (ultima_latitude BETWEEN -90 AND 90)),
    ultima_longitude DECIMAL(9,6) CHECK (ultima_longitude IS NULL OR (ultima_longitude BETWEEN -180 AND 180)),
    ultima_posicao_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Catálogo de Combustíveis Oferecidos
CREATE TABLE IF NOT EXISTS combustiveis (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    unidade_medida VARCHAR(10) NOT NULL DEFAULT 'LITROS'
);

-- 6. Tabela de Pedidos Civis
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    posto_id INTEGER NOT NULL REFERENCES postos(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE' 
        CHECK (status IN ('PENDENTE', 'CONFIRMADO_POSTO', 'EM_PREPARACAO', 'EM_TRANSPORTE', 'CONCLUIDO', 'CANCELADO')),
    valor_total DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (valor_total >= 0),
    endereco_entrega VARCHAR(255) NOT NULL,
    ponto_referencia VARCHAR(150),
    tipo_local VARCHAR(30) NOT NULL DEFAULT 'MARINA' 
        CHECK (tipo_local IN ('MARINA', 'CONDOMINIO', 'CHACARA', 'RODOVIA', 'RESIDENCIA', 'OUTRO')),
    instrucoes_adicionais TEXT,
    destino_latitude DECIMAL(9,6) NOT NULL CHECK (destino_latitude BETWEEN -90 AND 90),
    destino_longitude DECIMAL(9,6) NOT NULL CHECK (destino_longitude BETWEEN -180 AND 180),
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Linhas de Itens do Pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    combustivel_id INTEGER NOT NULL REFERENCES combustiveis(id) ON DELETE RESTRICT,
    quantidade_litros DECIMAL(10,2) NOT NULL CHECK (quantidade_litros > 0),
    valor_unitario DECIMAL(8,3) NOT NULL CHECK (valor_unitario >= 0),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0)
);

-- 8. Tabela de Entregas (Ciclo Operacional Hub-and-Spoke)
CREATE TABLE IF NOT EXISTS entregas (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL UNIQUE REFERENCES pedidos(id) ON DELETE RESTRICT,
    entregador_id INTEGER NOT NULL REFERENCES entregadores(id) ON DELETE RESTRICT,
    ordem_na_fila INTEGER NOT NULL DEFAULT 1 CHECK (ordem_na_fila >= 1),
    status_entrega VARCHAR(35) NOT NULL DEFAULT 'AGENDADO'
        CHECK (status_entrega IN (
            'AGENDADO',
            'EM_OUTRA_ENTREGA',
            'PREPARANDO_POSTO',
            'A_CAMINHO',
            'NO_LOCAL_ABASTECENDO',
            'RETORNANDO_AO_POSTO',
            'CONCLUIDO',
            'FALHA_CANCELADO'
        )),
    data_inicio_preparo TIMESTAMP WITH TIME ZONE,
    data_saida_posto TIMESTAMP WITH TIME ZONE,
    data_chegada_local TIMESTAMP WITH TIME ZONE,
    data_inicio_retorno TIMESTAMP WITH TIME ZONE,
    data_retorno_posto TIMESTAMP WITH TIME ZONE,
    tempo_estimado_atendimento_min INTEGER DEFAULT 20 CHECK (tempo_estimado_atendimento_min >= 0)
);

-- 9. Tabela de Previsões de IA para o Cliente Civil
CREATE TABLE IF NOT EXISTS previsoes_ia (
    id BIGSERIAL PRIMARY KEY,
    entrega_id INTEGER NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
    eta_previsto TIMESTAMP WITH TIME ZONE NOT NULL,
    tempo_espera_liberacao_minutos INTEGER NOT NULL DEFAULT 0 CHECK (tempo_espera_liberacao_minutos >= 0),
    tempo_preparo_posto_minutos INTEGER NOT NULL DEFAULT 12 CHECK (tempo_preparo_posto_minutos >= 0),
    tempo_viagem_cliente_minutos INTEGER NOT NULL DEFAULT 0 CHECK (tempo_viagem_cliente_minutos >= 0),
    confianca_score DECIMAL(5,4) DEFAULT 0.9500 CHECK (confianca_score BETWEEN 0 AND 1),
    risco_atraso BOOLEAN DEFAULT FALSE,
    fator_principal_risco VARCHAR(100),
    mensagem_humanizada TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Histórico Imutável de Auditoria de Status
CREATE TABLE IF NOT EXISTS historico_status_entrega (
    id BIGSERIAL PRIMARY KEY,
    entrega_id INTEGER NOT NULL REFERENCES entregas(id) ON DELETE CASCADE,
    status_anterior VARCHAR(35),
    status_novo VARCHAR(35) NOT NULL,
    descricao_motivo VARCHAR(255),
    origem_alteracao VARCHAR(30) NOT NULL DEFAULT 'ENTREGADOR_APP' 
        CHECK (origem_alteracao IN ('ENTREGADOR_APP', 'POSTO_WEB', 'SISTEMA_IA', 'CLIENTE_APP')),
    latitude_momento DECIMAL(9,6) CHECK (latitude_momento IS NULL OR (latitude_momento BETWEEN -90 AND 90)),
    longitude_momento DECIMAL(9,6) CHECK (longitude_momento IS NULL OR (longitude_momento BETWEEN -180 AND 180)),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- Índices de Alta Performance
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_entregas_fila 
    ON entregas (entregador_id, status_entrega, ordem_na_fila);

CREATE INDEX IF NOT EXISTS idx_previsoes_entrega 
    ON previsoes_ia (entrega_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_historico_entrega 
    ON historico_status_entrega (entrega_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_cliente 
    ON pedidos (cliente_id, data_pedido DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_posto 
    ON pedidos (posto_id, status);
