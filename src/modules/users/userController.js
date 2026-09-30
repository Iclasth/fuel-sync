const userService = require('./userService');

const listUsers = async (req, res, next) => {
    try {
        const { role, search, limit, offset } = req.query;
        const users = await userService.listUsers({ role, search, limit, offset });
        return res.status(200).json(users);
    } catch (err) {
        next(err);
    }
};

const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        return res.status(200).json(user);
    } catch (err) {
        next(err);
    }
};

const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const updated = await userService.updateUserRole(id, role, req.user);
        return res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    listUsers,
    getUserById,
    updateUserRole
};
