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
        await supabase.from('clientes').insert([
            {
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

    return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata?.role || 'cliente',
            name: data.user.user_metadata?.name || null
        }
    };
};

const getProfile = async (user) => {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        metadata: user.metadata
    };
};

const createCourier = async (adminUser, { name, email, password, cpf, phone, vehicleDescription, licensePlate }) => {
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
                licensePlate
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

    try {
        await supabase.from('entregadores').insert([
            {
                nome: name,
                cpf: cpf,
                telefone: phone,
                veiculo_descricao: vehicleDescription,
                placa: licensePlate
            }
        ]);
    } catch (_) {
        // Log silencioso caso tabela ainda não exista
    }

    return {
        id: data.user.id,
        email: data.user.email,
        role: 'entregador',
        name,
        cpf,
        phone,
        vehicleDescription,
        licensePlate
    };
};

module.exports = {
    signupCustomer,
    login,
    getProfile,
    createCourier
};
