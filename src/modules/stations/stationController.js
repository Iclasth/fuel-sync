const stationService = require('./stationService');
const { validateCreateStation, validateUpdateStation } = require('./stationValidator');

const createStation = async (req, res, next) => {
    try {
        const validatedData = validateCreateStation(req.body);
        const station = await stationService.createStation(validatedData);
        return res.status(201).json(station);
    } catch (err) {
        next(err);
    }
};

const getStations = async (req, res, next) => {
    try {
        const stations = await stationService.getStations();
        return res.status(200).json(stations);
    } catch (err) {
        next(err);
    }
};

const getStationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const station = await stationService.getStationById(Number(id));
        return res.status(200).json(station);
    } catch (err) {
        next(err);
    }
};

const updateStation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const validatedData = validateUpdateStation(req.body);
        const updated = await stationService.updateStation(Number(id), validatedData);
        return res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
};

const getStationFuels = async (req, res, next) => {
    try {
        const { stationId } = req.params;
        const fuels = await stationService.getStationFuels(Number(stationId));
        return res.status(200).json(fuels);
    } catch (err) {
        next(err);
    }
};

const createStationFuel = async (req, res, next) => {
    try {
        const { stationId } = req.params;
        const fuel = await stationService.createStationFuel(Number(stationId), req.body, req.user);
        return res.status(201).json(fuel);
    } catch (err) {
        next(err);
    }
};

const updateStationFuel = async (req, res, next) => {
    try {
        const { stationId, combustivelId } = req.params;
        const updated = await stationService.updateStationFuel(
            Number(stationId),
            Number(combustivelId),
            req.body,
            req.user
        );
        return res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
};

const getStationFuelHistory = async (req, res, next) => {
    try {
        const { stationId, combustivelId } = req.params;
        const history = await stationService.getStationFuelHistory(
            Number(stationId),
            Number(combustivelId)
        );
        return res.status(200).json(history);
    } catch (err) {
        next(err);
    }
};

const getStationAdmins = async (req, res, next) => {
    try {
        const { stationId } = req.params;
        const admins = await stationService.getStationAdmins(Number(stationId));
        return res.status(200).json(admins);
    } catch (err) {
        next(err);
    }
};

const assignStationAdmin = async (req, res, next) => {
    try {
        const { stationId } = req.params;
        const { user_id } = req.body;
        const linked = await stationService.assignStationAdmin(Number(stationId), user_id, req.user);
        return res.status(201).json(linked);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createStation,
    getStations,
    getStationById,
    updateStation,
    getStationFuels,
    createStationFuel,
    updateStationFuel,
    getStationFuelHistory,
    getStationAdmins,
    assignStationAdmin
};

