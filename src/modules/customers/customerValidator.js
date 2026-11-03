const { isValidCPF } = require('../../common/utils/cpfValidator');

const validateCreateCustomer = (req, res, next) => {
    const nomeVal = req.body.nome !== undefined ? req.body.nome : req.body.name;
    const { cpf } = req.body;
    const errors = [];

    if (!nomeVal || typeof nomeVal !== 'string' || nomeVal.trim().length < 2) {
        errors.push('O campo "nome" (ou "name") é obrigatório e deve ter no mínimo 2 caracteres.');
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

    if (nomeVal && typeof nomeVal === 'string') {
        req.body.nome = nomeVal.trim();
        req.body.name = nomeVal.trim();
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: 'Erro de validação', details: errors });
    }

    next();
};

const validateUpdateCustomer = (req, res, next) => {
    const { nome, name, cpf, email, telefone, endereco_padrao, ponto_referencia_padrao } = req.body;
    const errors = [];

    if (
        nome === undefined &&
        name === undefined &&
        cpf === undefined &&
        email === undefined &&
        telefone === undefined &&
        endereco_padrao === undefined &&
        ponto_referencia_padrao === undefined
    ) {
        return res.status(400).json({
            error: 'Erro de validação',
            details: ['Envie ao menos um campo para atualização.']
        });
    }

    const nomeVal = nome !== undefined ? nome : name;
    if (nomeVal !== undefined) {
        if (typeof nomeVal !== 'string' || nomeVal.trim().length < 2) {
            errors.push('O campo "nome" (ou "name") deve ser uma string com no mínimo 2 caracteres.');
        } else {
            req.body.nome = nomeVal.trim();
            req.body.name = nomeVal.trim();
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
