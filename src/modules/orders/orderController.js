const orderService = require('./orderService');
const { validateCreateOrder, validateUpdateOrderStatus } = require('./orderValidator');

const createOrder = async (req, res, next) => {
    try {
        const validatedData = validateCreateOrder(req.body, req.user);
        const order = await orderService.createOrder(validatedData, req.user);
        return res.status(201).json(order);
    } catch (err) {
        next(err);
    }
};

const listOrders = async (req, res, next) => {
    try {
        const orders = await orderService.listOrders(req.user, req.query);
        return res.status(200).json(orders);
    } catch (err) {
        next(err);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await orderService.getOrderById(id, req.user);
        return res.status(200).json(order);
    } catch (err) {
        next(err);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const validStatus = validateUpdateOrderStatus(req.body);
        const updated = await orderService.updateOrderStatus(id, validStatus);
        return res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
};

const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const motivo = req.body.motivo || null;
        const canceled = await orderService.cancelOrder(id, motivo, req.user);
        return res.status(200).json(canceled);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createOrder,
    listOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder
};
