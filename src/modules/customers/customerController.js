const customerService = require('./customerService');

const createCustomer = async (req, res, next) => {
    const { nome, name, cpf, email, telefone, endereco_padrao, ponto_referencia_padrao } = req.body;
    try {
        const payload = {
            nome: (nome || name || '').trim(),
            cpf
        };
        if (email !== undefined) payload.email = email;
        if (telefone !== undefined) payload.telefone = telefone;
        if (endereco_padrao !== undefined) payload.endereco_padrao = endereco_padrao;
        if (ponto_referencia_padrao !== undefined) payload.ponto_referencia_padrao = ponto_referencia_padrao;

        const customer = await customerService.createCustomer(payload);
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
    const { nome, name, cpf, email, telefone, endereco_padrao, ponto_referencia_padrao } = req.body;
    try {
        const payload = {};
        if (nome !== undefined || name !== undefined) {
            payload.nome = (nome !== undefined ? nome : name).trim();
        }
        if (cpf !== undefined) payload.cpf = cpf;
        if (email !== undefined) payload.email = email;
        if (telefone !== undefined) payload.telefone = telefone;
        if (endereco_padrao !== undefined) payload.endereco_padrao = endereco_padrao;
        if (ponto_referencia_padrao !== undefined) payload.ponto_referencia_padrao = ponto_referencia_padrao;

        const updatedCustomer = await customerService.updateCustomer(req.params.id, payload, req.user);
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
