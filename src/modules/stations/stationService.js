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

module.exports = {
    createStation,
    getStations,
    getStationById,
    updateStation
};
