const supabase = require('../../config/supabaseClient');
const AppError = require('../../common/errors/AppError');

const getCouriers = async (filters = {}) => {
    let query = supabase.from('entregadores').select('*');

    if (filters.posto_id) {
        query = query.eq('posto_id', Number(filters.posto_id));
    }

    const { data, error } = await query;

    if (error) {
        throw new AppError(`Erro ao buscar entregadores: ${error.message}`, 500);
    }

    return data || [];
};

const getCourierById = async (id) => {
    const { data, error } = await supabase
        .from('entregadores')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        throw new AppError('Entregador não encontrado.', 404);
    }

    return data;
};

const updateCourierStatus = async (id, status) => {
    const { data, error } = await supabase
        .from('entregadores')
        .update({ status })
        .eq('id', id)
        .select();

    if (error) {
        throw new AppError(`Erro ao atualizar status do entregador: ${error.message}`, 500);
    }

    if (!data || data.length === 0) {
        throw new AppError('Entregador não encontrado.', 404);
    }

    return data[0];
};

const updateCourierLocation = async (id, { latitude, longitude }) => {
    const { data, error } = await supabase
        .from('entregadores')
        .update({
            ultima_latitude: latitude,
            ultima_longitude: longitude,
            ultima_posicao_em: new Date().toISOString()
        })
        .eq('id', id)
        .select();

    if (error) {
        throw new AppError(`Erro ao atualizar localização do entregador: ${error.message}`, 500);
    }

    if (!data || data.length === 0) {
        throw new AppError('Entregador não encontrado.', 404);
    }

    return data[0];
};

module.exports = {
    getCouriers,
    getCourierById,
    updateCourierStatus,
    updateCourierLocation
};
