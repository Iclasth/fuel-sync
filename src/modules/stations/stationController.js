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

module.exports = {
    createStation,
    getStations,
    getStationById,
    updateStation
};
