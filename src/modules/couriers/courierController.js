const courierService = require('./courierService');
const { validateCourierStatus, validateCourierLocation } = require('./courierValidator');

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
        const validCoords = validateCourierLocation(req.body);
        const updated = await courierService.updateCourierLocation(Number(id), validCoords);
        return res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getCouriers,
    getCourierById,
    updateCourierStatus,
    updateCourierLocation
};
