const express = require('express');
const router = express.Router();
const stationController = require('./stationController');
const authMiddleware = require('../../common/middlewares/authMiddleware');
const roleMiddleware = require('../../common/middlewares/roleMiddleware');
const { UserRoles } = require('../../common/constants/enums');

/**
 * @openapi
 * /api/v1/stations:
 *   post:
 *     summary: Cadastra um novo posto de abastecimento base
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome_fantasia, cnpj, telefone, endereco, latitude, longitude]
 *             properties:
 *               nome_fantasia:
 *                 type: string
 *               razao_social:
 *                 type: string
 *               cnpj:
 *                 type: string
 *               telefone:
 *                 type: string
 *               endereco:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               tempo_medio_preparo_minutos:
 *                 type: integer
 *                 default: 12
 *     responses:
 *       201:
 *         description: Posto cadastrado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não autorizado (apenas posto_admin)
 *       409:
 *         description: Conflito de CNPJ duplicado
 */
router.post(
    '/',
    authMiddleware,
    roleMiddleware([UserRoles.POSTO_ADMIN]),
    stationController.createStation
);

/**
 * @openapi
 * /api/v1/stations:
 *   get:
 *     summary: Lista postos de abastecimento ativos
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de postos ativos
 *       401:
 *         description: Não autenticado
 */
router.get(
    '/',
    authMiddleware,
    stationController.getStations
);

/**
 * @openapi
 * /api/v1/stations/{id}:
 *   get:
 *     summary: Obtém detalhes de um posto pelo ID
 *     tags: [Stations]
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
 *         description: Dados do posto
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Posto não encontrado
 */
router.get(
    '/:id',
    authMiddleware,
    stationController.getStationById
);

/**
 * @openapi
 * /api/v1/stations/{id}:
 *   put:
 *     summary: Atualiza dados de um posto pelo ID
 *     tags: [Stations]
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
 *         description: Posto atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Não autorizado (apenas posto_admin)
 *       404:
 *         description: Posto não encontrado
 */
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware([UserRoles.POSTO_ADMIN]),
    stationController.updateStation
);

/**
 * @openapi
 * /api/v1/stations/{stationId}/fuels:
 *   get:
 *     summary: Lista combustíveis e preços praticados pelo posto
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de combustíveis do posto
 */
router.get(
    '/:stationId/fuels',
    authMiddleware,
    stationController.getStationFuels
);

/**
 * @openapi
 * /api/v1/stations/{stationId}/fuels:
 *   post:
 *     summary: Cadastra combustível com preço e estoque no posto
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Combustível cadastrado no posto com sucesso
 */
router.post(
    '/:stationId/fuels',
    authMiddleware,
    roleMiddleware([UserRoles.POSTO_ADMIN, UserRoles.ADMIN_GERAL]),
    stationController.createStationFuel
);

/**
 * @openapi
 * /api/v1/stations/{stationId}/fuels/{combustivelId}:
 *   put:
 *     summary: Atualiza preço e estoque do combustível no posto
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: combustivelId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Preço do combustível atualizado no posto
 */
router.put(
    '/:stationId/fuels/:combustivelId',
    authMiddleware,
    roleMiddleware([UserRoles.POSTO_ADMIN, UserRoles.ADMIN_GERAL]),
    stationController.updateStationFuel
);

/**
 * @openapi
 * /api/v1/stations/{stationId}/fuels/{combustivelId}/history:
 *   get:
 *     summary: Consulta o histórico auditado de alterações de preços
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: combustivelId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Histórico de preços do combustível
 */
router.get(
    '/:stationId/fuels/:combustivelId/history',
    authMiddleware,
    stationController.getStationFuelHistory
);

/**
 * @openapi
 * /api/v1/stations/{stationId}/admins:
 *   get:
 *     summary: Lista administradores vinculados ao posto
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de administradores do posto
 */
router.get(
    '/:stationId/admins',
    authMiddleware,
    roleMiddleware([UserRoles.POSTO_ADMIN, UserRoles.ADMIN_GERAL]),
    stationController.getStationAdmins
);

/**
 * @openapi
 * /api/v1/stations/{stationId}/admins:
 *   post:
 *     summary: Vincula um usuário posto_admin ao posto físico
 *     tags: [Stations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Administrador vinculado com sucesso
 */
router.post(
    '/:stationId/admins',
    authMiddleware,
    roleMiddleware([UserRoles.ADMIN_GERAL]),
    stationController.assignStationAdmin
);

module.exports = router;

