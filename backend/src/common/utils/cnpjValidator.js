/**
 * Remove formatação e caracteres não numéricos de um CNPJ.
 */
function cleanCNPJ(cnpj) {
    if (!cnpj) return '';
    return String(cnpj).replace(/\D/g, '').trim();
}

/**
 * Valida matematicamente um CNPJ brasileiro (14 dígitos).
 */
function validateCNPJ(cnpj) {
    const cleaned = cleanCNPJ(cnpj);

    if (!cleaned || cleaned.length !== 14) {
        return false;
    }

    // Rejeita sequências de dígitos idênticos repetidos
    if (/^(\d)\1+$/.test(cleaned)) {
        return false;
    }

    const digits = cleaned.split('').map(Number);

    // Validação do 1º dígito verificador
    const weightsFirst = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += digits[i] * weightsFirst[i];
    }
    let rest = sum % 11;
    const firstCheckDigit = rest < 2 ? 0 : 11 - rest;

    if (digits[12] !== firstCheckDigit) {
        return false;
    }

    // Validação do 2º dígito verificador
    const weightsSecond = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += digits[i] * weightsSecond[i];
    }
    rest = sum % 11;
    const secondCheckDigit = rest < 2 ? 0 : 11 - rest;

    return digits[13] === secondCheckDigit;
}

module.exports = {
    cleanCNPJ,
    validateCNPJ
};
