const catalogService = require('./catalogService');
const { validateFuelPayload } = require('./catalogValidator');

const listFuels = async (req, res, next) => {
    try {
        const fuels = await catalogService.listFuels();
        return res.status(200).json(fuels);
    } catch (err) {
        next(err);
    }
};

const getFuelById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const fuel = await catalogService.getFuelById(Number(id));
        return res.status(200).json(fuel);
    } catch (err) {
        next(err);
    }
};

const createFuel = async (req, res, next) => {
    try {
        const validatedData = validateFuelPayload(req.body);
        const fuel = await catalogService.createFuel(validatedData);
        return res.status(201).json(fuel);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    listFuels,
    getFuelById,
    createFuel
};
