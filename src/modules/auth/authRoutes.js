const express = require('express');
const authController = require('./authController');
const {
    validateCustomerSignup,
    validateLogin,
    validateCreateCourier
} = require('./authValidator');
const authMiddleware = require('../../common/middlewares/authMiddleware');
const authorizeRole = require('../../common/middlewares/roleMiddleware');

const router = express.Router();

/**
 * @openapi
 * /api/v1/auth/signup/customer:
 *   post:
 *     summary: Cadastra um novo cliente civil (B2C)
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - cpf
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: Maria da Silva
 *               email:
 *                 type: string
 *                 format: email
 *                 example: maria.silva@email.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: senhaForte123
 *               cpf:
 *                 type: string
 *                 example: "52998224725"
 *               phone:
 *                 type: string
 *                 example: "21999998888"
 *     responses:
 *       201:
 *         description: Cliente cadastrado com sucesso
 *       400:
 *         description: Erro de validação nos campos fornecidos
 *       409:
 *         description: E-mail ou CPF já cadastrado no sistema
 */
router.post('/signup/customer', validateCustomerSignup, authController.signupCustomer);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Autentica usuário com e-mail e senha
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@email.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: senha123
 *     responses:
 *       200:
 *         description: Login realizado com sucesso (retorna JWT e role)
 *       400:
 *         description: Dados de entrada inválidos
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', validateLogin, authController.login);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Retorna o perfil do usuário logado baseado no Bearer Token
 *     tags:
 *       - Autenticação
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário retornado com sucesso
 *       401:
 *         description: Não autenticado ou token expirado/inválido
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * @openapi
 * /api/v1/auth/admin/create-courier:
 *   post:
 *     summary: Cria um entregador credenciado para o posto (Restrito a posto_admin)
 *     tags:
 *       - Autenticação
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - cpf
 *               - phone
 *               - vehicleDescription
 *               - licensePlate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Carlos Entregador
 *               email:
 *                 type: string
 *                 example: carlos@posto.com
 *               password:
 *                 type: string
 *                 example: senhaEntregador123
 *               cpf:
 *                 type: string
 *                 example: "52998224725"
 *               phone:
 *                 type: string
 *                 example: "21988887777"
 *               vehicleDescription:
 *                 type: string
 *                 example: Furgão com Tanques Homologados
 *               licensePlate:
 *                 type: string
 *                 example: ABC1D23
 *     responses:
 *       201:
 *         description: Entregador cadastrado com sucesso
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado (requer papel posto_admin)
 */
router.post(
    '/admin/create-courier',
    authMiddleware,
    authorizeRole('posto_admin'),
    validateCreateCourier,
    authController.createCourier
);

module.exports = router;
