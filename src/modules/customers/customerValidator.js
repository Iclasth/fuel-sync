const { isValidCPF } = require('../../common/utils/cpfValidator');

const validateCreateCustomer = (req, res, next) => {
    const { name, cpf } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('O campo "name" é obrigatório e deve ter no mínimo 2 caracteres.');
    }

    if (!cpf) {
        errors.push('O campo "cpf" é obrigatório.');
    } else {
        const cpfStr = String(cpf).replace(/\D/g, '');
        if (!isValidCPF(cpfStr)) {
            errors.push('O campo "cpf" informado é inválido.');
        } else {
            req.body.cpf = cpfStr;
        }
    }

    if (name && typeof name === 'string') {
        req.body.name = name.trim();
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: 'Erro de validação', details: errors });
    }

    next();
};

const validateUpdateCustomer = (req, res, next) => {
    const { name, cpf } = req.body;
    const errors = [];

    if (name === undefined && cpf === undefined) {
        return res.status(400).json({
            error: 'Erro de validação',
            details: ['Envie ao menos um campo ("name" ou "cpf") para atualização.']
        });
    }

    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 2) {
            errors.push('O campo "name" deve ser uma string com no mínimo 2 caracteres.');
        } else {
            req.body.name = name.trim();
        }
    }

    if (cpf !== undefined) {
        const cpfStr = String(cpf).replace(/\D/g, '');
        if (!isValidCPF(cpfStr)) {
            errors.push('O campo "cpf" informado é inválido.');
        } else {
            req.body.cpf = cpfStr;
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: 'Erro de validação', details: errors });
    }

    next();
};

module.exports = {
    isValidCPF,
    validateCreateCustomer,
    validateUpdateCustomer
};
