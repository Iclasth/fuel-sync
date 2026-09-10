/**
 * Papéis de usuário da plataforma (RBAC).
 */
const UserRoles = Object.freeze({
    CLIENTE: 'cliente',
    POSTO_ADMIN: 'posto_admin',
    ENTREGADOR: 'entregador'
});

/**
 * Estados operacionais do ciclo de entrega Posto -> Cliente -> Posto.
 */
const DeliveryStatus = Object.freeze({
    AGENDADO: 'AGENDADO',
    EM_OUTRA_ENTREGA: 'EM_OUTRA_ENTREGA',
    PREPARANDO_POSTO: 'PREPARANDO_POSTO',
    A_CAMINHO: 'A_CAMINHO',
    NO_LOCAL_ABASTECENDO: 'NO_LOCAL_ABASTECENDO',
    RETORNANDO_AO_POSTO: 'RETORNANDO_AO_POSTO',
    CONCLUIDO: 'CONCLUIDO',
    FALHA_CANCELADO: 'FALHA_CANCELADO'
});

/**
 * Estados do pedido civil.
 */
const OrderStatus = Object.freeze({
    PENDENTE: 'PENDENTE',
    CONFIRMADO_POSTO: 'CONFIRMADO_POSTO',
    EM_PREPARACAO: 'EM_PREPARACAO',
    EM_TRANSPORTE: 'EM_TRANSPORTE',
    CONCLUIDO: 'CONCLUIDO',
    CANCELADO: 'CANCELADO'
});

/**
 * Tipos de local para entregas civis fracionadas.
 */
const LocationType = Object.freeze({
    MARINA: 'MARINA',
    CONDOMINIO: 'CONDOMINIO',
    CHACARA: 'CHACARA',
    RODOVIA: 'RODOVIA',
    RESIDENCIA: 'RESIDENCIA',
    OUTRO: 'OUTRO'
});

/**
 * Status de disponibilidade do entregador.
 */
const CourierStatus = Object.freeze({
    DISPONIVEL: 'DISPONIVEL',
    EM_ROTA: 'EM_ROTA',
    INDISPONIVEL: 'INDISPONIVEL'
});

/**
 * Origem dos eventos registrados no histórico de status para auditoria.
 */
const AuditOrigin = Object.freeze({
    ENTREGADOR_APP: 'ENTREGADOR_APP',
    POSTO_WEB: 'POSTO_WEB',
    SISTEMA_IA: 'SISTEMA_IA',
    CLIENTE_APP: 'CLIENTE_APP'
});

module.exports = {
    UserRoles,
    DeliveryStatus,
    OrderStatus,
    LocationType,
    CourierStatus,
    AuditOrigin
};
