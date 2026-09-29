const supabase = require('../../config/supabaseClient');
const AppError = require('../../common/errors/AppError');

const VALID_LOCATION_TYPES = ['MARINA', 'CONDOMINIO', 'CHACARA', 'RODOVIA', 'RESIDENCIA', 'OUTRO'];

/**
 * Obtém o id interno do cliente a partir do usuario_id (Supabase Auth UUID)
 */
const getClienteIdByUserId = async (userId) => {
    const { data: cliente, error } = await supabase
        .from('clientes')
        .select('id')
        .eq('usuario_id', userId)
        .maybeSingle();

    if (error) {
        throw new AppError(`Erro ao consultar perfil do cliente: ${error.message}`, 500);
    }

    if (!cliente) {
        // Se ainda não existir perfil em clientes, tenta vincular ou criar
        const { data: newCliente, error: insertError } = await supabase
            .from('clientes')
            .insert([{ usuario_id: userId, nome: 'Cliente', cpf: '00000000000', email: 'cliente@temp.com', telefone: '00000000000' }])
            .select('id')
            .maybeSingle();

        if (insertError || !newCliente) {
            throw new AppError('Perfil de cliente não encontrado.', 404);
        }
        return newCliente.id;
    }

    return cliente.id;
};

/**
 * Lista todos os locais de entrega cadastrados do cliente
 */
const listLocations = async (userId) => {
    const clienteId = await getClienteIdByUserId(userId);

    const { data, error } = await supabase
        .from('locais_entrega_cliente')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('padrao', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        throw new AppError(`Erro ao listar locais de entrega: ${error.message}`, 500);
    }

    return data || [];
};

/**
 * Cadastra um novo local de entrega para o cliente
 */
const createLocation = async (userId, locationData) => {
    const { apelido, tipo_local, endereco, ponto_referencia, latitude, longitude, padrao } = locationData;

    if (!apelido || typeof apelido !== 'string' || !apelido.trim()) {
        throw new AppError('O apelido do local é obrigatório.', 400);
    }

    if (!tipo_local || !VALID_LOCATION_TYPES.includes(tipo_local)) {
        throw new AppError(`Tipo de local inválido. Tipos permitidos: ${VALID_LOCATION_TYPES.join(', ')}.`, 400);
    }

    if (!endereco || typeof endereco !== 'string' || !endereco.trim()) {
        throw new AppError('O endereço completo é obrigatório.', 400);
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
        throw new AppError('Latitude inválida. Deve estar entre -90 e 90 graus.', 400);
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
        throw new AppError('Longitude inválida. Deve estar entre -180 e 180 graus.', 400);
    }

    const clienteId = await getClienteIdByUserId(userId);

    // Se marcado como padrão, desmarca locais anteriores do cliente
    if (padrao) {
        await supabase
            .from('locais_entrega_cliente')
            .update({ padrao: false })
            .eq('cliente_id', clienteId);
    }

    const { data, error } = await supabase
        .from('locais_entrega_cliente')
        .insert([{
            cliente_id: clienteId,
            apelido: apelido.trim(),
            tipo_local,
            endereco: endereco.trim(),
            ponto_referencia: ponto_referencia ? ponto_referencia.trim() : null,
            latitude: lat,
            longitude: lng,
            padrao: Boolean(padrao)
        }])
        .select()
        .single();

    if (error) {
        throw new AppError(`Erro ao cadastrar local de entrega: ${error.message}`, 500);
    }

    return data;
};

/**
 * Remove um local de entrega do cliente autenticado
 */
const deleteLocation = async (userId, locationId) => {
    const clienteId = await getClienteIdByUserId(userId);

    // Confere se o local pertence de fato a esse cliente
    const { data: existing, error: findError } = await supabase
        .from('locais_entrega_cliente')
        .select('id')
        .eq('id', locationId)
        .eq('cliente_id', clienteId)
        .maybeSingle();

    if (findError) {
        throw new AppError(`Erro ao buscar local de entrega: ${findError.message}`, 500);
    }

    if (!existing) {
        throw new AppError('Local de entrega não encontrado ou não pertence a este cliente.', 404);
    }

    const { error: deleteError } = await supabase
        .from('locais_entrega_cliente')
        .delete()
        .eq('id', locationId)
        .eq('cliente_id', clienteId);

    if (deleteError) {
        throw new AppError(`Erro ao remover local de entrega: ${deleteError.message}`, 500);
    }

    return true;
};

module.exports = {
    listLocations,
    createLocation,
    deleteLocation,
    VALID_LOCATION_TYPES
};
