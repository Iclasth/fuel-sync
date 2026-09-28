const supabase = require('../../config/supabaseClient');
const AppError = require('../../common/errors/AppError');

const createStation = async (stationData) => {
    const { data, error } = await supabase
        .from('postos')
        .insert([stationData])
        .select();

    if (error) {
        if (error.code === '23505' || (error.message && (error.message.includes('unique') || error.message.includes('duplicate')))) {
            throw new AppError('Já existe um posto cadastrado com este CNPJ.', 409);
        }
        throw new AppError(`Erro ao cadastrar posto: ${error.message}`, 500);
    }

    return data && data.length > 0 ? data[0] : data;
};

const getStations = async () => {
    const { data, error } = await supabase
        .from('postos')
        .select('*')
        .eq('ativo', true);

    if (error) {
        throw new AppError(`Erro ao listar postos: ${error.message}`, 500);
    }

    return data || [];
};

const getStationById = async (id) => {
    const { data, error } = await supabase
        .from('postos')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        throw new AppError('Posto não encontrado.', 404);
    }

    return data;
};

const updateStation = async (id, updateData) => {
    const { data, error } = await supabase
        .from('postos')
        .update(updateData)
        .eq('id', id)
        .select();

    if (error) {
        if (error.code === '23505' || (error.message && (error.message.includes('unique') || error.message.includes('duplicate')))) {
            throw new AppError('Já existe um posto cadastrado com este CNPJ.', 409);
        }
        throw new AppError(`Erro ao atualizar posto: ${error.message}`, 500);
    }

    if (!data || data.length === 0) {
        throw new AppError('Posto não encontrado.', 404);
    }

    return data[0];
};

const validateStationAccess = async (user, stationId) => {
    if (!user) {
        throw new AppError('Não autenticado.', 401);
    }

    // Admin geral possui acesso irrestrito
    if (user.role === 'admin_geral') {
        return true;
    }

    // Posto admin precisa estar vinculado ao posto
    if (user.role === 'posto_admin') {
        const { data, error } = await supabase
            .from('posto_administradores')
            .select('*')
            .eq('user_id', user.id)
            .eq('posto_id', stationId)
            .single();

        if (error || !data) {
            throw new AppError('Acesso negado: seu perfil não administra este posto.', 403);
        }
        return true;
    }

    throw new AppError('Acesso negado para o seu perfil.', 403);
};

const getStationFuels = async (stationId) => {
    const { data, error } = await supabase
        .from('posto_combustiveis')
        .select('*, combustiveis(*)')
        .eq('posto_id', stationId);

    if (error) {
        throw new AppError(`Erro ao consultar combustíveis do posto: ${error.message}`, 500);
    }

    return data || [];
};

const createStationFuel = async (stationId, fuelData, user) => {
    await validateStationAccess(user, stationId);

    const preco = Number(fuelData.preco_litro);
    if (isNaN(preco) || preco <= 0) {
        throw new AppError('O campo "preco_litro" deve ser um valor maior que zero.', 400);
    }

    const payload = {
        posto_id: Number(stationId),
        combustivel_id: Number(fuelData.combustivel_id),
        preco_litro: preco,
        estoque_litros: fuelData.estoque_litros !== undefined ? Number(fuelData.estoque_litros) : 0,
        disponivel: fuelData.disponivel !== undefined ? Boolean(fuelData.disponivel) : true,
        atualizado_por: user.id
    };

    const { data, error } = await supabase
        .from('posto_combustiveis')
        .insert([payload])
        .select();

    if (error) {
        if (error.code === '23505' || (error.message && error.message.includes('unique'))) {
            throw new AppError('Este combustível já está cadastrado para este posto.', 409);
        }
        throw new AppError(`Erro ao cadastrar combustível no posto: ${error.message}`, 500);
    }

    return data[0];
};

const updateStationFuel = async (stationId, combustivelId, updateData, user) => {
    await validateStationAccess(user, stationId);

    const payload = {
        atualizado_por: user.id,
        atualizado_em: new Date().toISOString()
    };

    if (updateData.preco_litro !== undefined) {
        const preco = Number(updateData.preco_litro);
        if (isNaN(preco) || preco <= 0) {
            throw new AppError('O campo "preco_litro" deve ser maior que zero.', 400);
        }
        payload.preco_litro = preco;
    }

    if (updateData.estoque_litros !== undefined) {
        const estoque = Number(updateData.estoque_litros);
        if (isNaN(estoque) || estoque < 0) {
            throw new AppError('O campo "estoque_litros" não pode ser negativo.', 400);
        }
        payload.estoque_litros = estoque;
    }

    if (updateData.disponivel !== undefined) {
        payload.disponivel = Boolean(updateData.disponivel);
    }

    const { data, error } = await supabase
        .from('posto_combustiveis')
        .update(payload)
        .eq('posto_id', Number(stationId))
        .eq('combustivel_id', Number(combustivelId))
        .select();

    if (error) {
        throw new AppError(`Erro ao atualizar preço de combustível: ${error.message}`, 500);
    }

    if (!data || data.length === 0) {
        throw new AppError('Combustível não encontrado para este posto.', 404);
    }

    return data[0];
};

const getStationFuelHistory = async (stationId, combustivelId) => {
    const { data, error } = await supabase
        .from('historico_precos_combustivel')
        .select('*')
        .eq('posto_id', Number(stationId))
        .eq('combustivel_id', Number(combustivelId))
        .order('alterado_em', { ascending: false });

    if (error) {
        throw new AppError(`Erro ao buscar histórico de preços: ${error.message}`, 500);
    }

    return data || [];
};

module.exports = {
    createStation,
    getStations,
    getStationById,
    updateStation,
    validateStationAccess,
    getStationFuels,
    createStationFuel,
    updateStationFuel,
    getStationFuelHistory
};
