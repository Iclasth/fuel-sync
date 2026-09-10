const supabase = require('../../config/supabaseClient');
const AppError = require('../../common/errors/AppError');

const createCustomer = async (customerData) => {
    const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select();

    if (error) {
        if (error.code === '23505' || (error.message && (error.message.includes('unique') || error.message.includes('duplicate')))) {
            throw new AppError('Já existe um cliente cadastrado com este CPF.', 409);
        }
        throw new AppError(`Erro ao cadastrar cliente: ${error.message}`, 500);
    }

    return data && data.length > 0 ? data[0] : data;
};

const getCustomers = async () => {
    const { data, error } = await supabase
        .from('customers')
        .select('*');

    if (error) {
        throw new AppError(`Erro ao buscar clientes: ${error.message}`, 500);
    }

    return data;
};

const updateCustomer = async (customerId, updatedData) => {
    const { data, error } = await supabase
        .from('customers')
        .update(updatedData)
        .eq('id', customerId)
        .select();

    if (error) {
        if (error.code === '23505' || (error.message && (error.message.includes('unique') || error.message.includes('duplicate')))) {
            throw new AppError('Já existe um cliente cadastrado com este CPF.', 409);
        }
        throw new AppError(`Erro ao atualizar cliente: ${error.message}`, 500);
    }

    if (!data || data.length === 0) {
        throw new AppError('Cliente não encontrado.', 404);
    }

    return data[0];
};

const deleteCustomer = async (customerId) => {
    const { data, error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .select();

    if (error) {
        throw new AppError(`Erro ao deletar cliente: ${error.message}`, 500);
    }

    if (!data || data.length === 0) {
        throw new AppError('Cliente não encontrado.', 404);
    }

    return { success: true, message: 'Cliente deletado com sucesso.' };
};

module.exports = {
    createCustomer,
    getCustomers,
    updateCustomer,
    deleteCustomer
};
