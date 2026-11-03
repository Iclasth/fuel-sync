const supabase = require('../../config/supabaseClient');
const AppError = require('../../common/errors/AppError');

const createCustomer = async (customerData) => {
    const { data, error } = await supabase
        .from('clientes')
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
        .from('clientes')
        .select('*');

    if (error) {
        throw new AppError(`Erro ao buscar clientes: ${error.message}`, 500);
    }

    return data;
};

const updateCustomer = async (customerId, updatedData, user = null) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);
    const targetColumn = isUuid ? 'usuario_id' : 'id';
    const targetValue = isUuid ? customerId : Number(customerId);

    if (user && user.role !== 'admin_geral') {
        const query = supabase
            .from('clientes')
            .select('*')
            .eq(targetColumn, targetValue);

        let clienteRecord = null;
        let fetchError = null;

        if (typeof query.maybeSingle === 'function') {
            const res = await query.maybeSingle();
            clienteRecord = res.data;
            fetchError = res.error;
        } else if (typeof query.single === 'function') {
            const res = await query.single();
            clienteRecord = res.data;
            fetchError = res.error;
        } else {
            const res = await query;
            fetchError = res?.error;
            clienteRecord = res?.data ? (Array.isArray(res.data) ? res.data[0] : res.data) : null;
        }

        if (fetchError) {
            throw new AppError(`Erro ao consultar cliente: ${fetchError.message}`, 500);
        }

        if (!clienteRecord) {
            throw new AppError('Cliente não encontrado.', 404);
        }

        if (clienteRecord.usuario_id !== user.id) {
            throw new AppError('Acesso negado. Você não tem permissão para alterar dados de outro cliente.', 403);
        }
    }

    const { data, error } = await supabase
        .from('clientes')
        .update(updatedData)
        .eq(targetColumn, targetValue)
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
        .from('clientes')
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
