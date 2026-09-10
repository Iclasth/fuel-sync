const supabase = require('../../config/supabaseClient');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Token de autenticação com formato inválido. Use: Bearer <token>'
            });
        }

        const token = authHeader.substring(7).trim();
        if (!token) {
            return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
        }

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data || !data.user) {
            return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }

        const user = data.user;
        req.user = {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'cliente',
            metadata: user.user_metadata || {}
        };

        next();
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno ao validar autenticação.' });
    }
};

module.exports = authMiddleware;
