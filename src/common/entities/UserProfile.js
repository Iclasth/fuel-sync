const { UserRoles } = require('../constants/enums');

class UserProfile {
    constructor({
        id,
        email,
        nome,
        role = UserRoles.CLIENTE,
        created_at = new Date()
    }) {
        this.id = id;
        this.email = String(email || '').trim().toLowerCase();
        this.nome = String(nome || '').trim();
        this.role = role || UserRoles.CLIENTE;
        this.created_at = created_at instanceof Date ? created_at : new Date(created_at);
    }

    isAdmin() {
        return this.role === UserRoles.POSTO_ADMIN;
    }

    isCourier() {
        return this.role === UserRoles.ENTREGADOR;
    }

    isCustomer() {
        return this.role === UserRoles.CLIENTE;
    }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            nome: this.nome,
            role: this.role,
            created_at: this.created_at
        };
    }
}

module.exports = UserProfile;
