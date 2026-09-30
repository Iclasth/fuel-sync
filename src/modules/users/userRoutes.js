const express = require('express');
const userController = require('./userController');
const { validateUpdateUserRole } = require('./userValidator');
const authMiddleware = require('../../common/middlewares/authMiddleware');
const roleMiddleware = require('../../common/middlewares/roleMiddleware');
const { UserRoles } = require('../../common/constants/enums');

const router = express.Router();

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     summary: Lista todos os usuários cadastrados (Restrito a admin_geral)
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filtrar por papel (cliente, posto_admin, entregador, admin_geral)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca textual por nome ou e-mail
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado (requer admin_geral)
 */
router.get(
    '/',
    authMiddleware,
    roleMiddleware([UserRoles.ADMIN_GERAL]),
    userController.listUsers
);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     summary: Retorna detalhes de um usuário específico (Restrito a admin_geral)
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dados do usuário retornados com sucesso
 *       404:
 *         description: Usuário não encontrado
 */
router.get(
    '/:id',
    authMiddleware,
    roleMiddleware([UserRoles.ADMIN_GERAL]),
    userController.getUserById
);

/**
 * @openapi
 * /api/v1/users/{id}/role:
 *   patch:
 *     summary: Atualiza o papel/role de um usuário no sistema RBAC (Restrito a admin_geral)
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [cliente, posto_admin, entregador, admin_geral]
 *     responses:
 *       200:
 *         description: Papel atualizado com sucesso
 *       400:
 *         description: Papel inválido ou tentativa de auto-rebaixamento
 *       403:
 *         description: Acesso negado (requer admin_geral)
 *       404:
 *         description: Usuário não encontrado
 */
router.patch(
    '/:id/role',
    authMiddleware,
    roleMiddleware([UserRoles.ADMIN_GERAL]),
    validateUpdateUserRole,
    userController.updateUserRole
);

module.exports = router;
