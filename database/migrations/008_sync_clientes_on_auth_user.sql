-- ==============================================================================
-- Migration: 008_sync_clientes_on_auth_user.sql
-- Descrição: Sincronização automatizada e redundante entre Supabase Auth (auth.users),
--            public.perfis_usuarios e public.clientes para garantia de persistência.
-- ==============================================================================

-- 1. Permissões explícitas e desativação de RLS na tabela clientes
GRANT ALL ON TABLE public.clientes TO postgres, anon, authenticated, service_role;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;

-- 2. Atualização da função do gatilho para persistência atômica de novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR;
    user_name VARCHAR;
    user_cpf VARCHAR;
    user_phone VARCHAR;
BEGIN
    user_role  := COALESCE(NEW.raw_user_meta_data->>'role', 'cliente');
    user_name  := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));
    user_cpf   := NULLIF(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'cpf', ''), '\D', '', 'g'), '');
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'telefone', '');

    -- Sincroniza em public.perfis_usuarios (SSOT para RBAC)
    INSERT INTO public.perfis_usuarios (id, email, nome, role)
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_role
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nome = EXCLUDED.nome;

    -- Se o papel for cliente e houver CPF informado, sincroniza atomicamente em public.clientes
    IF user_role = 'cliente' AND user_cpf IS NOT NULL AND LENGTH(user_cpf) = 11 THEN
        INSERT INTO public.clientes (usuario_id, nome, email, cpf, telefone)
        VALUES (
            NEW.id,
            user_name,
            NEW.email,
            user_cpf,
            user_phone
        )
        ON CONFLICT (usuario_id) DO UPDATE SET
            nome = EXCLUDED.nome,
            email = EXCLUDED.email,
            telefone = EXCLUDED.telefone;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantia de recriação do gatilho na tabela auth.users
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
    END IF;
END $$;

-- 4. Backfill: Inserir em clientes todos os usuários com papel 'cliente' que ainda não constam na tabela
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO public.clientes (usuario_id, nome, email, cpf, telefone)
        SELECT
            u.id,
            COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'nome', split_part(u.email, '@', 1)),
            u.email,
            COALESCE(
                NULLIF(REGEXP_REPLACE(u.raw_user_meta_data->>'cpf', '\D', '', 'g'), ''),
                LPAD(ROW_NUMBER() OVER ()::TEXT, 11, '0')
            ),
            COALESCE(u.raw_user_meta_data->>'phone', u.raw_user_meta_data->>'telefone', '00000000000')
        FROM auth.users u
        WHERE COALESCE(u.raw_user_meta_data->>'role', 'cliente') = 'cliente'
          AND NOT EXISTS (SELECT 1 FROM public.clientes c WHERE c.usuario_id = u.id)
        ON CONFLICT (usuario_id) DO NOTHING;
    END IF;
END $$;
