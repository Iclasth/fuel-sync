const {
    validateCoordinates,
    validatePositiveAmount,
    validateLocationType,
    allowedTransitions,
    validateDeliveryTransition
} = require('./validations');

// Entidades de Domínio
const Station = require('./Station');
const Courier = require('./Courier');
const Fuel = require('./Fuel');
const Customer = require('./Customer');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Delivery = require('./Delivery');
const AIPrediction = require('./AIPrediction');
const DeliveryStatusHistory = require('./DeliveryStatusHistory');
const UserProfile = require('./UserProfile');

module.exports = {
    // Funções utilitárias de validação de domínio
    validateCoordinates,
    validatePositiveAmount,
    validateLocationType,
    allowedTransitions,
    validateDeliveryTransition,

    // Classes de Entidades da API
    Station,
    Courier,
    Fuel,
    Customer,
    Order,
    OrderItem,
    Delivery,
    AIPrediction,
    DeliveryStatusHistory,
    UserProfile
};
