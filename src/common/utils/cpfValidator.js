/**
 * Validação matemática do algoritmo oficial de dígitos verificadores do CPF.
 * @param {string} cpf - String contendo o CPF formatado ou apenas dígitos.
 * @returns {boolean} - true se o CPF for válido, false caso contrário.
 */
function isValidCPF(cpf) {
    if (!cpf || typeof cpf !== 'string') return false;

    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;

    // Elimina CPFs com todos os dígitos iguais (ex: 00000000000, 11111111111...)
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

module.exports = { isValidCPF };
