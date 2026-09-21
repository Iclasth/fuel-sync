const supabase = require('../../config/supabaseClient');
const AppError = require('../../common/errors/AppError');
const { OrderStatus } = require('../../common/constants/enums');

const getCustomerByUserId = async (userId) => {
    const { data, error } = await supabase
        .from('clientes')
        .select('id')
        .eq('usuario_id', userId)
        .single();

    if (error || !data) {
        throw new AppError('Perfil de cliente não encontrado para o usuário logado.', 404);
    }

    return data;
};

const createOrder = async (orderData, user) => {
    let clienteId = orderData.cliente_id;

    if (user.role === 'cliente') {
        const customer = await getCustomerByUserId(user.id);
        clienteId = customer.id;
    }

    if (!clienteId) {
        throw new AppError('O identificador do cliente (cliente_id) é obrigatório.', 400);
    }

    const { data: orderRows, error: orderError } = await supabase
        .from('pedidos')
        .insert([{
            cliente_id: clienteId,
            posto_id: orderData.posto_id,
            status: OrderStatus.PENDENTE,
            valor_total: orderData.valor_total,
            endereco_entrega: orderData.endereco_entrega,
            ponto_referencia: orderData.ponto_referencia,
            tipo_local: orderData.tipo_local,
            instrucoes_adicionais: orderData.instrucoes_adicionais,
            destino_latitude: orderData.destino_latitude,
            destino_longitude: orderData.destino_longitude
        }])
        .select();

    if (orderError || !orderRows || orderRows.length === 0) {
        throw new AppError(`Erro ao criar pedido: ${orderError ? orderError.message : 'Falha na inserção'}`, 500);
    }

    const createdOrder = orderRows[0];

    const itemsToInsert = orderData.itens.map(item => ({
        pedido_id: createdOrder.id,
        combustivel_id: item.combustivel_id,
        quantidade_litros: item.quantidade_litros,
        valor_unitario: item.valor_unitario,
        subtotal: item.subtotal
    }));

    const { data: itemRows, error: itemsError } = await supabase
        .from('itens_pedido')
        .insert(itemsToInsert)
        .select();

    if (itemsError) {
        throw new AppError(`Erro ao cadastrar itens do pedido: ${itemsError.message}`, 500);
    }

    return {
        ...createdOrder,
        itens: itemRows || []
    };
};

const listOrders = async (user, filters = {}) => {
    let customerId = null;
    if (user.role === 'cliente') {
        const customer = await getCustomerByUserId(user.id);
        customerId = customer.id;
    }

    let query = supabase.from('pedidos').select('*');

    if (customerId) {
        query = query.eq('cliente_id', customerId);
    } else if (filters.posto_id) {
        query = query.eq('posto_id', Number(filters.posto_id));
    }

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
        throw new AppError(`Erro ao buscar pedidos: ${error.message}`, 500);
    }

    return data || [];
};

const getOrderById = async (orderId, user) => {
    let customerId = null;
    if (user.role === 'cliente') {
        const customer = await getCustomerByUserId(user.id);
        customerId = customer.id;
    }

    const { data: order, error } = await supabase
        .from('pedidos')
        .select('*, itens_pedido (*)')
        .eq('id', Number(orderId))
        .single();

    if (error || !order) {
        throw new AppError('Pedido não encontrado.', 404);
    }

    if (customerId && order.cliente_id !== customerId) {
        throw new AppError('Acesso negado: você não tem permissão para visualizar este pedido.', 403);
    }

    return order;
};

const updateOrderStatus = async (orderId, newStatus) => {
    const { data, error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', Number(orderId))
        .select();

    if (error) {
        throw new AppError(`Erro ao atualizar status do pedido: ${error.message}`, 500);
    }

    if (!data || data.length === 0) {
        throw new AppError('Pedido não encontrado.', 404);
    }

    return data[0];
};

const cancelOrder = async (orderId, motivo, user) => {
    const order = await getOrderById(orderId, user);

    if (order.status !== OrderStatus.PENDENTE) {
        throw new AppError(`O pedido está com status "${order.status}" e não pode ser cancelado.`, 400);
    }

    const { data, error } = await supabase
        .from('pedidos')
        .update({ status: OrderStatus.CANCELADO })
        .eq('id', Number(orderId))
        .select();

    if (error) {
        throw new AppError(`Erro ao cancelar pedido: ${error.message}`, 500);
    }

    return data && data.length > 0 ? data[0] : order;
};

module.exports = {
    createOrder,
    listOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder
};
