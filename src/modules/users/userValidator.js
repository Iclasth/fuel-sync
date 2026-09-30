const AppError = require('../../common/errors/AppError');
const { UserRoles } = require('../../common/constants/enums');

const validateUpdateUserRole = (req, res, next) => {
    const { role } = req.body || {};

    if (!role) {
        return next(new AppError('O campo role é obrigatório.', 400));
    }

    const validRoles = Object.values(UserRoles);
    if (!validRoles.includes(role)) {
        return next(
            new AppError(
                `Papel inválido. Papéis permitidos: ${validRoles.join(', ')}`,
                400
            )
        );
    }

    next();
};

module.exports = {
    validateUpdateUserRole
};
