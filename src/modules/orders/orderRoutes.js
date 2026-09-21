const express = require('express');
const router = express.Router();
const orderController = require('./orderController');
const authMiddleware = require('../../common/middlewares/authMiddleware');
const roleMiddleware = require('../../common/middlewares/roleMiddleware');
const { UserRoles } = require('../../common/constants/enums');

/**
 * @openapi
 * /api/v1/orders:
 *   post:
 *     summary: Cria um novo pedido de abastecimento civil fracionado (B2C)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [posto_id, endereco_entrega, tipo_local, destino_latitude, destino_longitude, itens]
 *             properties:
 *               posto_id:
 *                 type: integer
 *               endereco_entrega:
 *                 type: string
 *               ponto_referencia:
 *                 type: string
 *                 example: Marina da Glória, Píer B, Vaga 14 - Lancha Marlin
 *               tipo_local:
 *                 type: string
 *                 enum: [MARINA, CONDOMINIO, CHACARA, RODOVIA, RESIDENCIA, OUTRO]
 *               instrucoes_adicionais:
 *                 type: string
 *               destino_latitude:
 *                 type: number
 *               destino_longitude:
 *                 type: number
 *               itens:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [combustivel_id, quantidade_litros, valor_unitario]
 *                   properties:
 *                     combustivel_id:
 *                       type: integer
 *                     quantidade_litros:
 *                       type: number
 *                     valor_unitario:
 *                       type: number
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso e subtotais calculados
 *       400:
 *         description: Dados de pedido ou itens inválidos
 *       401:
 *         description: Não autenticado
 */
router.post(
    '/',
    authMiddleware,
    roleMiddleware([UserRoles.CLIENTE, UserRoles.POSTO_ADMIN]),
    orderController.createOrder
);

/**
 * @openapi
 * /api/v1/orders:
 *   get:
 *     summary: Lista pedidos com segregação por perfil (cliente vê os seus, posto_admin vê do posto)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: posto_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       401:
 *         description: Não autenticado
 */
router.get(
    '/',
    authMiddleware,
    orderController.listOrders
);

/**
 * @openapi
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Obtém detalhes de um pedido e suas linhas de combustíveis
 *     tags: [Orders]
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
 *         description: Dados do pedido com itens
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado a pedido de outro cliente
 *       404:
 *         description: Pedido não encontrado
 */
router.get(
    '/:id',
    authMiddleware,
    orderController.getOrderById
);

/**
 * @openapi
 * /api/v1/orders/{id}/status:
 *   patch:
 *     summary: Atualiza status do pedido (restrito a administradores do posto)
 *     tags: [Orders]
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
 *                 enum: [PENDENTE, CONFIRMADO_POSTO, EM_PREPARACAO, EM_TRANSPORTE, CONCLUIDO, CANCELADO]
 *     responses:
 *       200:
 *         description: Status do pedido atualizado com sucesso
 *       400:
 *         description: Status inválido
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não autorizado (apenas posto_admin)
 */
router.patch(
    '/:id/status',
    authMiddleware,
    roleMiddleware([UserRoles.POSTO_ADMIN]),
    orderController.updateOrderStatus
);

/**
 * @openapi
 * /api/v1/orders/{id}/cancel:
 *   post:
 *     summary: Cancela um pedido (cliente pode cancelar enquanto status for PENDENTE)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pedido cancelado com sucesso
 *       400:
 *         description: Pedido não pode mais ser cancelado
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não autorizado
 */
router.post(
    '/:id/cancel',
    authMiddleware,
    roleMiddleware([UserRoles.CLIENTE, UserRoles.POSTO_ADMIN]),
    orderController.cancelOrder
);

module.exports = router;
