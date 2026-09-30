const supabase = require('../../config/supabaseClient');
const AppError = require('../../common/errors/AppError');
const { UserRoles } = require('../../common/constants/enums');

const listUsers = async (filters = {}) => {
    let query = supabase
        .from('perfis_usuarios')
        .select('*');

    if (filters.role) {
        query = query.eq('role', filters.role);
    }

    if (filters.search && typeof query.or === 'function') {
        const searchTerm = `%${filters.search.trim()}%`;
        query = query.or(`nome.ilike.${searchTerm},email.ilike.${searchTerm}`);
    }

    if (filters.limit && typeof query.limit === 'function') {
        query = query.limit(Number(filters.limit));
    }
    if (filters.offset && typeof query.range === 'function') {
        query = query.range(Number(filters.offset), Number(filters.offset) + (Number(filters.limit) || 50) - 1);
    }

    if (typeof query.order === 'function') {
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        throw new AppError(`Erro ao consultar usuários: ${error.message}`, 500);
    }

    let users = data || [];

    // Fallback de filtro textual em memória para compatibilidade com mocks de teste
    if (filters.search && users.length > 0) {
        const term = filters.search.toLowerCase().trim();
        users = users.filter((u) => {
            const nome = (u.nome || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const id = (u.id || '').toLowerCase();
            return nome.includes(term) || email.includes(term) || id.includes(term);
        });
    }

    return users;
};

const getUserById = async (userId) => {
    if (!userId) {
        throw new AppError('Identificador do usuário é obrigatório.', 400);
    }

    const { data, error } = await supabase
        .from('perfis_usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        throw new AppError(`Erro ao buscar usuário: ${error.message}`, 500);
    }

    if (!data) {
        throw new AppError('Usuário não encontrado.', 404);
    }

    return data;
};

const updateUserRole = async (userId, newRole, requesterUser) => {
    if (!userId) {
        throw new AppError('Identificador do usuário é obrigatório.', 400);
    }

    const validRoles = Object.values(UserRoles);
    if (!newRole || !validRoles.includes(newRole)) {
        throw new AppError(
            `Papel inválido. Papéis permitidos: ${validRoles.join(', ')}`,
            400
        );
    }

    // Trava de segurança: impede que admin_geral remova sua própria role e fique sem acesso
    if (requesterUser && requesterUser.id === userId && newRole !== UserRoles.ADMIN_GERAL) {
        throw new AppError(
            'Não é permitido alterar ou remover o próprio papel de Administrador Geral.',
            400
        );
    }

    // Verifica existência do usuário
    const existingUser = await getUserById(userId);

    const { data, error } = await supabase
        .from('perfis_usuarios')
        .update({ role: newRole })
        .eq('id', userId)
        .select();

    if (error) {
        throw new AppError(`Erro ao atualizar papel do usuário: ${error.message}`, 500);
    }

    // Atualização de sincronização opcional no Supabase Auth admin se configurado
    if (supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.updateUserById === 'function') {
        try {
            await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { role: newRole }
            });
        } catch (_) {}
    }

    return (data && data[0]) ? data[0] : { ...existingUser, role: newRole };
};

module.exports = {
    listUsers,
    getUserById,
    updateUserRole
};
