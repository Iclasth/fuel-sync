const customerService = require('./customerService');

const createCustomer = async (req, res, next) => {
    const { name, cpf } = req.body;
    try {
        const customer = await customerService.createCustomer({ name, cpf });
        return res.status(201).json(customer);
    } catch (error) {
        next(error);
    }
};

const getCustomers = async (req, res, next) => {
    try {
        const customers = await customerService.getCustomers();
        return res.status(200).json(customers);
    } catch (error) {
        next(error);
    }
};

const updateCustomer = async (req, res, next) => {
    const { name, cpf } = req.body;
    try {
        const updatedCustomer = await customerService.updateCustomer(req.params.id, { name, cpf });
        return res.status(200).json(updatedCustomer);
    } catch (error) {
        next(error);
    }
};

const deleteCustomer = async (req, res, next) => {
    try {
        await customerService.deleteCustomer(req.params.id);
        return res.status(204).send();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCustomer,
    getCustomers,
    updateCustomer,
    deleteCustomer
};
