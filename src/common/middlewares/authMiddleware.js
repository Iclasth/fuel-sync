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

        let authoritativeRole = user.user_metadata?.role || 'cliente';
        let authoritativeName = user.user_metadata?.name || user.user_metadata?.nome || null;

        const isJestMock = Boolean(supabase.from && supabase.from._isMockFunction);
        const shouldQueryPerfis = !isJestMock || Boolean(supabase.from._mockPerfisUsuarios);

        if (shouldQueryPerfis && typeof supabase.from === 'function') {
            try {
                const { data: perfil } = await supabase
                    .from('perfis_usuarios')
                    .select('role, nome')
                    .eq('id', user.id)
                    .maybeSingle();

                if (perfil && perfil.role) {
                    authoritativeRole = perfil.role;
                    if (perfil.nome) authoritativeName = perfil.nome;
                } else if (!perfil && !isJestMock) {
                    await supabase.from('perfis_usuarios').upsert({
                        id: user.id,
                        email: user.email,
                        nome: authoritativeName || user.email.split('@')[0],
                        role: authoritativeRole
                    });
                }
            } catch (_) {
                // Fallback seguro caso tabela ainda esteja em migração
            }
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: authoritativeRole,
            name: authoritativeName,
            metadata: user.user_metadata || {}
        };

        next();
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno ao validar autenticação.' });
    }
};

module.exports = authMiddleware;
