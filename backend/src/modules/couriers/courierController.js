const courierService = require('./courierService');
const { validateCourierStatus, validateCourierLocation } = require('./courierValidator');
const AppError = require('../../common/errors/AppError');

const getCouriers = async (req, res, next) => {
    try {
        const couriers = await courierService.getCouriers(req.query);
        return res.status(200).json(couriers);
    } catch (err) {
        next(err);
    }
};

const getCourierById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const courier = await courierService.getCourierById(Number(id));
        return res.status(200).json(courier);
    } catch (err) {
        next(err);
    }
};

const updateCourierStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user && req.user.role !== 'admin_geral') {
            const courier = await courierService.getCourierByUserId(req.user.id);
            if (!courier || courier.id !== Number(id)) {
                throw new AppError('Você não tem permissão para alterar dados de outro entregador.', 403);
            }
        }

        const validStatus = validateCourierStatus(req.body.status);
        const updated = await courierService.updateCourierStatus(Number(id), validStatus);
        return res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
};

const updateCourierLocation = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user && req.user.role !== 'admin_geral') {
            const courier = await courierService.getCourierByUserId(req.user.id);
            if (!courier || courier.id !== Number(id)) {
                throw new AppError('Você não tem permissão para atualizar dados de outro entregador.', 403);
            }
        }

        const validCoords = validateCourierLocation(req.body);
        const updated = await courierService.updateCourierLocation(Number(id), validCoords);
        return res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
};

const getCourierMe = async (req, res, next) => {
    try {
        const courier = await courierService.getCourierByUserId(req.user.id);
        return res.status(200).json(courier);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getCouriers,
    getCourierById,
    getCourierMe,
    updateCourierStatus,
    updateCourierLocation
};
