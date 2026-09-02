const customerService = require('../services/customerService.js');

const createCustomer = async (req, res, next) => {
    const { name, cpf } = req.body;
    try {
        const customer = await customerService.createCustomer({ name, cpf });
        return res.status(201).json(customer);
    } catch (error) {
        const status = error.statusCode || 400;
        return res.status(status).json({ error: error.message });
    }
}

const getCustomers = async (req, res, next) => {
    try {
        const customers = await customerService.getCustomers();
        return res.status(200).json(customers);
    } catch (error) {
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}

const updateCustomer = async (req, res, next) => {
    const { name, cpf } = req.body;
    try {
        const updatedCustomer = await customerService.updateCustomer(req.params.id, { name, cpf });
        return res.status(200).json(updatedCustomer);
    } catch (error) {
        const status = error.statusCode || 400;
        return res.status(status).json({ error: error.message });
    }
}

const deleteCustomer = async (req, res, next) => {
    try {
        await customerService.deleteCustomer(req.params.id);
        return res.status(204).send();
    } catch (error) {
        const status = error.statusCode || 400;
        return res.status(status).json({ error: error.message });
    }
}

module.exports = {
    createCustomer,
    getCustomers,
    updateCustomer,
    deleteCustomer
}