const authorizeRole = (...allowedRoles) => {
    const roles = allowedRoles.flat();
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({
                error: 'Acesso negado: seu perfil não possui permissão para acessar este recurso.'
            });
        }

        const isAuthorized =
            roles.includes(req.user.role) ||
            (req.user.role === 'admin_geral' && (roles.includes('posto_admin') || roles.includes('admin_geral')));

        if (!isAuthorized) {
            return res.status(403).json({
                error: 'Acesso negado: seu perfil não possui permissão para acessar este recurso.'
            });
        }
        next();
    };
};

module.exports = authorizeRole;
