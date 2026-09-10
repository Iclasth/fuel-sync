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

module.exports = router;
