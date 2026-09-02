const supabase = require('../config/supabaseClient');

const createCustomer = async (customerData) => {
    const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select();

    if (error) {
        if (error.code === '23505' || (error.message && (error.message.includes('unique') || error.message.includes('duplicate')))) {
            const err = new Error('Já existe um cliente cadastrado com este CPF.');
            err.statusCode = 409;
            throw err;
        }
        const err = new Error(`Erro ao cadastrar cliente: ${error.message}`);
        err.statusCode = 500;
        throw err;
    }

    return data && data.length > 0 ? data[0] : data;
}

const getCustomers = async () => {
    const { data, error } = await supabase
        .from('customers')
        .select('*');

    if (error) {
        const err = new Error(`Erro ao buscar clientes: ${error.message}`);
        err.statusCode = 500;
        throw err;
    }

    return data;
}

const updateCustomer = async (customerId, updatedData) => {
    const { data, error } = await supabase
        .from('customers')
        .update(updatedData)
        .eq('id', customerId)
        .select();

    if (error) {
        if (error.code === '23505' || (error.message && (error.message.includes('unique') || error.message.includes('duplicate')))) {
            const err = new Error('Já existe um cliente cadastrado com este CPF.');
            err.statusCode = 409;
            throw err;
        }
        const err = new Error(`Erro ao atualizar cliente: ${error.message}`);
        err.statusCode = 500;
        throw err;
    }

    if (!data || data.length === 0) {
        const err = new Error('Cliente não encontrado.');
        err.statusCode = 404;
        throw err;
    }

    return data[0];
}

const deleteCustomer = async (customerId) => {
    const { data, error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .select();

    if (error) {
        const err = new Error(`Erro ao deletar cliente: ${error.message}`);
        err.statusCode = 500;
        throw err;
    }

    if (!data || data.length === 0) {
        const err = new Error('Cliente não encontrado.');
        err.statusCode = 404;
        throw err;
    }

    return { success: true, message: 'Cliente deletado com sucesso.' };
}

module.exports = {
    createCustomer,
    getCustomers,
    updateCustomer,
    deleteCustomer
}
