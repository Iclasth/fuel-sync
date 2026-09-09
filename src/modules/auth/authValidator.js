function isValidCPF(cpf) {
    if (!cpf || typeof cpf !== 'string') return false;

    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;

    // Elimina CPFs com todos os dígitos iguais (00000000000, 11111111111...)
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    // Validação do 1º dígito verificador
    let sum = 0;
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cleaned.substring(i - 1, i), 10) * (11 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10), 10)) return false;

    // Validação do 2º dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cleaned.substring(i - 1, i), 10) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11), 10)) return false;

    return true;
}

function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

const validateCustomerSignup = (req, res, next) => {
    const { name, email, password, cpf, phone } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('O campo "nome" é obrigatório e deve ter no mínimo 2 caracteres.');
    }

    if (!email || !isValidEmail(email)) {
        errors.push('O campo "email" é obrigatório e deve ser um e-mail válido.');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        errors.push('O campo "senha" é obrigatório e deve ter no mínimo 6 caracteres.');
    }

    if (!cpf) {
        errors.push('O campo "cpf" é obrigatório.');
    } else {
        const cpfStr = String(cpf);
        if (!isValidCPF(cpfStr)) {
            errors.push('O campo "cpf" informado é inválido.');
        } else {
            req.body.cpf = cpfStr.replace(/\D/g, '');
        }
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
        errors.push('O campo "telefone" é obrigatório e deve conter DDD e número.');
    }

    if (name && typeof name === 'string') {
        req.body.name = name.trim();
    }
    if (email && typeof email === 'string') {
        req.body.email = email.trim().toLowerCase();
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: 'Erro de validação', details: errors });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !isValidEmail(email)) {
        errors.push('O campo "email" é obrigatório e deve ser um e-mail válido.');
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
        errors.push('O campo "senha" é obrigatório.');
    }

    if (errors.length > 0) {
        return res.status(400).json({ error: 'Erro de validação', details: errors });
    }

    if (email && typeof email === 'string') {
        req.body.email = email.trim().toLowerCase();
    }

    next();
};

const validateCreateCourier = (req, res, next) => {
    const { name, email, password, cpf, phone, vehicleDescription, licensePlate } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('O campo "nome" é obrigatório e deve ter no mínimo 2 caracteres.');
    }

    if (!email || !isValidEmail(email)) {
        errors.push('O campo "email" é obrigatório e deve ser válido.');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        errors.push('O campo "senha" é obrigatório e deve ter no mínimo 6 caracteres.');
    }

    if (!cpf || !isValidCPF(String(cpf))) {
        errors.push('O campo "cpf" informado é inválido.');
    } else {
        req.body.cpf = String(cpf).replace(/\D/g, '');
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
        errors.push('O campo "telefone" é obrigatório.');
    }

    if (!vehicleDescription || typeof vehicleDescription !== 'string' || vehicleDescription.trim().length < 2) {
        errors.push('O campo "veiculo_descricao" é obrigatório.');
    }

    if (!licensePlate || typeof licensePlate !== 'string' || licensePlate.trim().length < 4) {
        errors.push('O campo "placa" é obrigatório.');
    }

    if (name && typeof name === 'string') req.body.name = name.trim();
    if (email && typeof email === 'string') req.body.email = email.trim().toLowerCase();

    if (errors.length > 0) {
        return res.status(400).json({ error: 'Erro de validação', details: errors });
    }

    next();
};

module.exports = {
    isValidCPF,
    isValidEmail,
    validateCustomerSignup,
    validateLogin,
    validateCreateCourier
};
