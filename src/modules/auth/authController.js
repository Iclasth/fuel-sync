const authService = require('./authService');

const signupCustomer = async (req, res, next) => {
    try {
        const result = await authService.signupCustomer(req.body);
        return res.status(201).json({
            user: result.user,
            session: result.session,
            message: 'Cliente cadastrado com sucesso.'
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const result = await authService.getProfile(req.user);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const createCourier = async (req, res, next) => {
    try {
        const courier = await authService.createCourier(req.user, req.body);
        return res.status(201).json({
            courier,
            message: 'Entregador cadastrado com sucesso.'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    signupCustomer,
    login,
    getMe,
    createCourier
};
