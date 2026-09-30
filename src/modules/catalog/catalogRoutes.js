const express = require('express');
const router = express.Router();
const catalogController = require('./catalogController');
const authMiddleware = require('../../common/middlewares/authMiddleware');
const roleMiddleware = require('../../common/middlewares/roleMiddleware');
const { UserRoles } = require('../../common/constants/enums');

/**
 * @openapi
 * /api/v1/catalog:
 *   get:
 *     summary: Lista tipos de combustíveis disponíveis no catálogo (alias)
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de combustíveis
 *       401:
 *         description: Não autenticado
 * /api/v1/catalog/fuels:
 *   get:
 *     summary: Lista tipos de combustíveis disponíveis no catálogo
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de combustíveis
 *       401:
 *         description: Não autenticado
 */
router.get(
    '/',
    authMiddleware,
    catalogController.listFuels
);

router.get(
    '/fuels',
    authMiddleware,
    catalogController.listFuels
);

/**
 * @openapi
 * /api/v1/catalog/fuels/{id}:
 *   get:
 *     summary: Obtém detalhes de um combustível pelo ID
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalhes do combustível
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Combustível não encontrado
 */
router.get(
    '/fuels/:id',
    authMiddleware,
    catalogController.getFuelById
);

/**
 * @openapi
 * /api/v1/catalog/fuels:
 *   post:
 *     summary: Cadastra um novo tipo de combustível no sistema
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome]
 *             properties:
 *               nome:
 *                 type: string
 *               unidade_medida:
 *                 type: string
 *                 default: LITROS
 *     responses:
 *       201:
 *         description: Combustível cadastrado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não autorizado (apenas posto_admin)
 *       409:
 *         description: Conflito de combustível duplicado
 */
router.post(
    '/fuels',
    authMiddleware,
    roleMiddleware([UserRoles.POSTO_ADMIN, UserRoles.ADMIN_GERAL]),
    catalogController.createFuel
);

/**
 * @openapi
 * /api/v1/catalog/fuels/{id}:
 *   delete:
 *     summary: Remove um tipo de combustível do catálogo global
 *     tags: [Catalog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Combustível removido do catálogo com sucesso
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não autorizado
 *       404:
 *         description: Combustível não encontrado
 */
router.delete(
    '/fuels/:id',
    authMiddleware,
    roleMiddleware([UserRoles.ADMIN_GERAL, UserRoles.POSTO_ADMIN]),
    catalogController.deleteFuel
);

module.exports = router;
