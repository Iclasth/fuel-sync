const deliveryLocationsService = require('./deliveryLocationsService');

const listLocations = async (req, res, next) => {
    try {
        const locations = await deliveryLocationsService.listLocations(req.user.id);
        return res.status(200).json(locations);
    } catch (err) {
        next(err);
    }
};

const createLocation = async (req, res, next) => {
    try {
        const location = await deliveryLocationsService.createLocation(req.user.id, req.body);
        return res.status(201).json(location);
    } catch (err) {
        next(err);
    }
};

const deleteLocation = async (req, res, next) => {
    try {
        const { id } = req.params;
        await deliveryLocationsService.deleteLocation(req.user.id, Number(id));
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    listLocations,
    createLocation,
    deleteLocation
};
