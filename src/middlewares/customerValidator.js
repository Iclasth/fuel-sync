/**
 * Helper para validar se a string do CPF possui os dígitos verificadores válidos.
 */
function isValidCPF(cpf) {
    if (!cpf || typeof cpf !== 'string') return false;
    
    // Remove caracteres não numéricos
    const cleaned = cpf.replace(/\D/g, '');
    
    if (cleaned.length !== 11) return false;
    
    // Elimina CPFs inválidos conhecidos (ex: 00000000000, 11111111111...)
    if (/^(\d)\1{10}$/.test(cleaned)) return false;
    
    // Validação dos dois dígitos verificadores
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
    
    return true;
}

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
