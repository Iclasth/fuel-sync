const express = require('express');
const router = express.Router();
const aiController = require('./aiController');
const authMiddleware = require('../../common/middlewares/authMiddleware');

router.use(authMiddleware);

/**
 * @openapi
 * /api/v1/ai/predict-eta:
 *   post:
 *     summary: Calcula a previsão cognitiva de tempo estimado de entrega (ETA) via IA e telemetria
 *     tags:
 *       - AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: integer
 *                 description: ID do pedido cadastrado para resolução automática das coordenadas e dados do posto e destino
 *                 example: 42
 *               station:
 *                 type: object
 *                 description: Informações de origem e tempo de preparo do posto de combustível
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   nome:
 *                     type: string
 *                     example: Posto Marina Náutica
 *                   latitude:
 *                     type: number
 *                     example: -22.9121
 *                   longitude:
 *                     type: number
 *                     example: -43.1789
 *                   tempo_medio_preparo:
 *                     type: integer
 *                     example: 15
 *               destination:
 *                 type: object
 *                 description: Informações geográficas do local de entrega civil
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: -22.9519
 *                   longitude:
 *                     type: number
 *                     example: -43.1843
 *                   tipo_local:
 *                     type: string
 *                     example: MARINA
 *                   ponto_referencia:
 *                     type: string
 *                     example: Píer B, Vaga 12
 *               weatherConditions:
 *                 type: string
 *                 description: Condições climáticas atuais na região do trajeto (ex. mar calmo, vento forte)
 *                 example: Chuva leve e mar calmo
 *               trafficCondition:
 *                 type: string
 *                 description: Condições de tráfego naval ou rodoviário no percurso
 *                 example: Moderado
 *               setbackDescription:
 *                 type: string
 *                 description: Descrição de contratempos ou atrasos operacionais reportados pelo condutor
 *                 example: Trânsito intenso no canal de acesso ao píer
 *     responses:
 *       200:
 *         description: Previsão de ETA calculada com sucesso
 *       201:
 *         description: Estimativa cognitiva criada e registrada com sucesso
 *       400:
 *         description: Parâmetros insuficientes ou inválidos para cálculo do ETA (station e destination ausentes sem orderId)
 *       401:
 *         description: Não autenticado ou token inválido
 */
router.post('/predict-eta', aiController.predictEta);

module.exports = router;
