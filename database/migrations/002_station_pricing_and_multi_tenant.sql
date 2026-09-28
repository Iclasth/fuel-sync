-- ==============================================================================
-- Migration: 002_station_pricing_and_multi_tenant.sql
-- Descrição: Modelo Multi-tenant para Postos, Gestão Tarifária por Posto e
--            Auditoria Automatizada via Trigger Nativa do PostgreSQL
-- ==============================================================================

-- 1. Expansão de Papéis RBAC em perfis_usuarios para inclusão de 'admin_geral'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'perfis_usuarios_role_check'
          AND table_name = 'perfis_usuarios'
    ) THEN
        ALTER TABLE perfis_usuarios DROP CONSTRAINT perfis_usuarios_role_check;
    END IF;
END $$;

ALTER TABLE perfis_usuarios
    ADD CONSTRAINT perfis_usuarios_role_check
    CHECK (role IN ('cliente', 'posto_admin', 'entregador', 'admin_geral'));

-- 2. Tabela de Vinculação Multi-tenant (Posto <-> Administradores de Posto)
CREATE TABLE IF NOT EXISTS posto_administradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    posto_id INTEGER NOT NULL REFERENCES postos(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_posto_admin_link UNIQUE (user_id, posto_id)
);

CREATE INDEX IF NOT EXISTS idx_posto_administradores_user
    ON posto_administradores(user_id);

CREATE INDEX IF NOT EXISTS idx_posto_administradores_posto
    ON posto_administradores(posto_id);

-- 3. Tabela de Precificação e Disponibilidade por Posto
CREATE TABLE IF NOT EXISTS posto_combustiveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posto_id INTEGER NOT NULL REFERENCES postos(id) ON DELETE CASCADE,
    combustivel_id INTEGER NOT NULL REFERENCES combustiveis(id) ON DELETE CASCADE,
    preco_litro NUMERIC(10,2) NOT NULL CHECK (preco_litro > 0),
    estoque_litros NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (estoque_litros >= 0),
    disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_por UUID,
    CONSTRAINT uq_posto_combustivel_preco UNIQUE (posto_id, combustivel_id)
);

CREATE INDEX IF NOT EXISTS idx_posto_combustiveis_posto
    ON posto_combustiveis(posto_id);

CREATE INDEX IF NOT EXISTS idx_posto_combustiveis_combustivel
    ON posto_combustiveis(combustivel_id);

-- 4. Tabela de Histórico e Auditoria de Preços de Combustível
CREATE TABLE IF NOT EXISTS historico_precos_combustivel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posto_combustivel_id UUID REFERENCES posto_combustiveis(id) ON DELETE SET NULL,
    posto_id INTEGER NOT NULL REFERENCES postos(id) ON DELETE CASCADE,
    combustivel_id INTEGER NOT NULL REFERENCES combustiveis(id) ON DELETE CASCADE,
    preco_anterior NUMERIC(10,2),
    preco_novo NUMERIC(10,2) NOT NULL CHECK (preco_novo > 0),
    alterado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    alterado_por UUID
);

CREATE INDEX IF NOT EXISTS idx_hist_precos_posto_combustivel
    ON historico_precos_combustivel(posto_id, combustivel_id, alterado_em DESC);

-- 5. Trigger PostgreSQL para Registro Automático e Atômico do Histórico
CREATE OR REPLACE FUNCTION trg_fn_log_historico_preco()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.preco_litro IS DISTINCT FROM NEW.preco_litro) THEN
        INSERT INTO historico_precos_combustivel (
            posto_combustivel_id,
            posto_id,
            combustivel_id,
            preco_anterior,
            preco_novo,
            alterado_em,
            alterado_por
        ) VALUES (
            NEW.id,
            NEW.posto_id,
            NEW.combustivel_id,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.preco_litro ELSE NULL END,
            NEW.preco_litro,
            CURRENT_TIMESTAMP,
            NEW.atualizado_por
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_preco_combustivel ON posto_combustiveis;

CREATE TRIGGER trg_audit_preco_combustivel
AFTER INSERT OR UPDATE OF preco_litro ON posto_combustiveis
FOR EACH ROW
EXECUTE FUNCTION trg_fn_log_historico_preco();
