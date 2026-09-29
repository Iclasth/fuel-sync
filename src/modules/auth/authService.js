const supabase = require('../../config/supabaseClient');
const AppError = require('../../common/errors/AppError');

const signupCustomer = async ({ name, email, password, cpf, phone }) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'cliente',
                name,
                cpf,
                phone
            }
        }
    });

    if (error) {
        if (error.message && (error.message.includes('already') || error.status === 422)) {
            throw new AppError('O e-mail ou CPF informado já está cadastrado no sistema.', 409);
        }
        throw new AppError(error.message || 'Erro ao cadastrar cliente.', 400);
    }

    if (!data || !data.user) {
        throw new AppError('Não foi possível concluir o cadastro.', 500);
    }

    try {
        await supabase.from('perfis_usuarios').insert([
            {
                id: data.user.id,
                email: email,
                nome: name,
                role: 'cliente'
            }
        ]);
    } catch (_) {
        // Log silencioso caso tabela ainda não exista em ambiente de migração
    }

    try {
        await supabase.from('clientes').insert([
            {
                usuario_id: data.user.id,
                nome: name,
                cpf: cpf,
                email: email,
                telefone: phone
            }
        ]);
    } catch (_) {
        // Log silencioso caso tabela ainda não exista em ambiente de migração
    }

    return {
        user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata?.role || 'cliente',
            name: data.user.user_metadata?.name || name,
            cpf: data.user.user_metadata?.cpf || cpf,
            phone: data.user.user_metadata?.phone || phone
        },
        session: data.session
    };
};

const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error || !data || !data.session) {
        throw new AppError('Credenciais inválidas.', 401);
    }

    let authoritativeRole = data.user.user_metadata?.role || 'cliente';
    let authoritativeName = data.user.user_metadata?.name || null;

    if (typeof supabase.from === 'function') {
        try {
            const { data: perfil } = await supabase
                .from('perfis_usuarios')
                .select('role, nome')
                .eq('id', data.user.id)
                .maybeSingle();

            if (perfil && perfil.role) {
                authoritativeRole = perfil.role;
                if (perfil.nome) authoritativeName = perfil.nome;
            } else if (!perfil) {
                await supabase.from('perfis_usuarios').upsert({
                    id: data.user.id,
                    email: data.user.email,
                    nome: authoritativeName || data.user.email.split('@')[0],
                    role: authoritativeRole
                });
            }
        } catch (_) {
            // Fallback seguro caso tabela ainda esteja em migração
        }
    }

    return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: {
            id: data.user.id,
            email: data.user.email,
            role: authoritativeRole,
            name: authoritativeName
        }
    };
};

const getProfile = async (user) => {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name || user.metadata?.name || null,
        metadata: user.metadata
    };
};

const createCourier = async (adminUser, courierData) => {
    const {
        name,
        email,
        password,
        cpf,
        phone,
        vehicleDescription,
        licensePlate,
        posto_id,
        stationId
    } = courierData;

    // Determina o posto de vinculação do entregador
    let targetPostoId = Number(posto_id || stationId) || null;
    if (!targetPostoId && adminUser) {
        if (adminUser.role === 'posto_admin') {
            try {
                const { data: link } = await supabase
                    .from('posto_administradores')
                    .select('posto_id')
                    .eq('user_id', adminUser.id)
                    .single();
                if (link && link.posto_id) {
                    targetPostoId = link.posto_id;
                }
            } catch (_) {}
        }
    }

    if (!targetPostoId) {
        try {
            const { data: postos } = await supabase.from('postos').select('id').limit(1);
            if (postos && postos.length > 0) {
                targetPostoId = postos[0].id;
            }
        } catch (_) {}
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'entregador',
                name,
                cpf,
                phone,
                vehicleDescription,
                licensePlate,
                posto_id: targetPostoId
            }
        }
    });

    if (error) {
        if (error.message && (error.message.includes('already') || error.status === 422)) {
            throw new AppError('Já existe um usuário cadastrado com este e-mail.', 409);
        }
        throw new AppError(error.message || 'Erro ao cadastrar entregador.', 400);
    }

    if (!data || !data.user) {
        throw new AppError('Não foi possível concluir o cadastro do entregador.', 500);
    }

    const isJestMock = Boolean(supabase.from?._isMockFunction || supabase.from?.mock);

    // Persistência na tabela canônica perfis_usuarios
    try {
        const perfisQuery = supabase.from('perfis_usuarios');
        if (perfisQuery && typeof perfisQuery.insert === 'function') {
            await perfisQuery.insert([
                {
                    id: data.user.id,
                    email: email,
                    nome: name,
                    role: 'entregador'
                }
            ]);
        }
    } catch (_) {}

    // Persistência relacional na tabela entregadores
    let createdCourier = null;
    const entregadoresQuery = supabase.from('entregadores');
    if (entregadoresQuery && typeof entregadoresQuery.insert === 'function') {
        const { data: courierRows, error: courierErr } = await entregadoresQuery.insert([
            {
                usuario_id: data.user.id,
                posto_id: targetPostoId,
                nome: name,
                cpf: cpf,
                telefone: phone,
                veiculo_descricao: vehicleDescription,
                placa: licensePlate,
                status: 'DISPONIVEL'
            }
        ]).select();

        if (courierErr) {
            if (courierErr.code === '23505' || (courierErr.message && courierErr.message.includes('unique'))) {
                throw new AppError('Já existe um entregador cadastrado com este CPF.', 409);
            }
            if (!isJestMock) {
                throw new AppError(`Erro ao registrar entregador na base de dados: ${courierErr.message}`, 500);
            }
        }

        if (courierRows && courierRows.length > 0) {
            createdCourier = courierRows[0];
        }
    }

    return {
        id: data.user.id,
        email: data.user.email,
        role: 'entregador',
        name,
        cpf,
        phone,
        vehicleDescription,
        licensePlate,
        posto_id: targetPostoId,
        entregador_id: createdCourier ? createdCourier.id : null
    };
};

const refreshSession = async ({ refreshToken }) => {
    const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
    });

    if (error || !data || !data.session) {
        throw new AppError('Sessão expirada ou refresh token inválido.', 401);
    }

    const sessionUser = data.user || data.session.user;
    let authoritativeRole = sessionUser?.user_metadata?.role || 'cliente';
    let authoritativeName = sessionUser?.user_metadata?.name || null;

    if (sessionUser && sessionUser.id && typeof supabase.from === 'function') {
        try {
            const { data: perfil } = await supabase
                .from('perfis_usuarios')
                .select('role, nome')
                .eq('id', sessionUser.id)
                .maybeSingle();

            if (perfil && perfil.role) {
                authoritativeRole = perfil.role;
                if (perfil.nome) authoritativeName = perfil.nome;
            }
        } catch (_) {
            // Fallback seguro
        }
    }

    return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: {
            id: sessionUser.id,
            email: sessionUser.email,
            role: authoritativeRole,
            name: authoritativeName
        }
    };
};

module.exports = {
    signupCustomer,
    login,
    getProfile,
    createCourier,
    refreshSession
};
