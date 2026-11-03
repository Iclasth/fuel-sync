-- ==============================================================================
-- Migration: 004_sync_perfis_usuarios.sql
-- Descrição: Sincronização automatizada entre Supabase Auth (auth.users) e a
--            tabela canônica public.perfis_usuarios (Fonte Única da Verdade para RBAC)
-- ==============================================================================

-- 1. Garantir constraint de papéis válidos em perfis_usuarios
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

-- 2. Backfill: Inserir todos os usuários existentes em auth.users que ainda não estejam em perfis_usuarios
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO public.perfis_usuarios (id, email, nome, role)
        SELECT
            u.id,
            u.email,
            COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'nome', split_part(u.email, '@', 1)),
            COALESCE(u.raw_user_meta_data->>'role', 'cliente')
        FROM auth.users u
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email;
    END IF;
END $$;

-- 3. Função e Gatilho (Trigger) para sincronização automática no evento de novo cadastro
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfis_usuarios (id, email, nome, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'cliente')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
    END IF;
END $$;

-- 4. Permissões na tabela perfis_usuarios
GRANT ALL ON TABLE public.perfis_usuarios TO postgres, anon, authenticated, service_role;
ALTER TABLE public.perfis_usuarios DISABLE ROW LEVEL SECURITY;
