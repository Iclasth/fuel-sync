const express = require('express');
const router = express.Router();
const courierController = require('./courierController');
const authMiddleware = require('../../common/middlewares/authMiddleware');
const roleMiddleware = require('../../common/middlewares/roleMiddleware');
const { UserRoles } = require('../../common/constants/enums');

/**
 * @openapi
 * /api/v1/couriers:
 *   get:
 *     summary: Lista entregadores cadastrados (filtro opcional por posto)
 *     tags: [Couriers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: posto_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de entregadores
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não autorizado (apenas posto_admin)
 */
router.get(
    '/',
    authMiddleware,
    roleMiddleware([UserRoles.POSTO_ADMIN]),
    courierController.getCouriers
);

/**
 * @openapi
 * /api/v1/couriers/{id}:
 *   get:
 *     summary: Obtém detalhes de um entregador pelo ID
 *     tags: [Couriers]
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
 *         description: Detalhes do entregador
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não autorizado
 *       404:
 *         description: Entregador não encontrado
 */
router.get(
    '/:id',
    authMiddleware,
    roleMiddleware([UserRoles.POSTO_ADMIN, UserRoles.ENTREGADOR]),
    courierController.getCourierById
);

/**
 * @openapi
 * /api/v1/couriers/{id}/status:
 *   patch:
 *     summary: Atualiza status de disponibilidade operacional do entregador
 *     tags: [Couriers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DISPONIVEL, EM_ROTA, INDISPONIVEL]
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Status inválido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não autorizado
 */
router.patch(
    '/:id/status',
    authMiddleware,
    roleMiddleware([UserRoles.POSTO_ADMIN, UserRoles.ENTREGADOR]),
    courierController.updateCourierStatus
);

/**
 * @openapi
 * /api/v1/couriers/{id}/location:
 *   patch:
 *     summary: Atualiza coordenadas geográficas recentes do entregador
 *     tags: [Couriers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Localização atualizada com sucesso
 *       400:
 *         description: Coordenadas inválidas
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não autorizado (apenas entregador)
 */
router.patch(
    '/:id/location',
    authMiddleware,
    roleMiddleware([UserRoles.ENTREGADOR]),
    courierController.updateCourierLocation
);

module.exports = router;
