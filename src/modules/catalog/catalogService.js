const supabase = require('../../config/supabaseClient');
const AppError = require('../../common/errors/AppError');

const listFuels = async () => {
    const { data, error } = await supabase
        .from('combustiveis')
        .select('*');

    if (error) {
        throw new AppError(`Erro ao listar combustíveis: ${error.message}`, 500);
    }

    return data || [];
};

const getFuelById = async (id) => {
    const { data, error } = await supabase
        .from('combustiveis')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        throw new AppError('Combustível não encontrado.', 404);
    }

    return data;
};

const createFuel = async (fuelData) => {
    const { data, error } = await supabase
        .from('combustiveis')
        .insert([fuelData])
        .select();

    if (error) {
        if (error.code === '23505' || (error.message && (error.message.includes('unique') || error.message.includes('duplicate')))) {
            throw new AppError('Já existe um combustível cadastrado com este nome.', 409);
        }
        throw new AppError(`Erro ao cadastrar combustível: ${error.message}`, 500);
    }

    return data && data.length > 0 ? data[0] : data;
};

const deleteFuel = async (id) => {
    const { data, error } = await supabase
        .from('combustiveis')
        .delete()
        .eq('id', Number(id))
        .select();

    if (error) {
        throw new AppError(`Erro ao remover combustível: ${error.message}`, 500);
    }

    if (!data || data.length === 0) {
        throw new AppError('Combustível não encontrado.', 404);
    }

    return data[0];
};

module.exports = {
    listFuels,
    getFuelById,
    createFuel,
    deleteFuel
};
