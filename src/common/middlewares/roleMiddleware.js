const authorizeRole = (...allowedRoles) => {
    const roles = allowedRoles.flat();
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Acesso negado: seu perfil não possui permissão para acessar este recurso.'
            });
        }
        next();
    };
};

module.exports = authorizeRole;
