const express = require('express');
const customerController = require('./customerController');
const { validateCreateCustomer, validateUpdateCustomer } = require('./customerValidator');
const authMiddleware = require('../../common/middlewares/authMiddleware');

const router = express.Router();

// Aplica autenticação obrigatória para todas as rotas do domínio de clientes
router.use(authMiddleware);

/**
 * @openapi
 * /customers:
 *   post:
 *     summary: Cadastra um novo cliente
 *     tags:
 *       - Customers
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
 *               - cpf
 *             properties:
 *               name:
 *                 type: string
 *                 example: Maria Gasolina da Silva
 *               cpf:
 *                 type: string
 *                 example: 52998224725
 *     responses:
 *       201:
 *         description: Cliente cadastrado com sucesso
 *       400:
 *         description: Dados de validação inválidos
 *       401:
 *         description: Não autenticado ou token inválido
 *       409:
 *         description: CPF já cadastrado no sistema
 *       500:
 *         description: Erro interno no servidor
 */
router.post('/', validateCreateCustomer, customerController.createCustomer);

/**
 * @openapi
 * /customers:
 *   get:
 *     summary: Retorna a lista de todos os clientes
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes retornada com sucesso
 *       401:
 *         description: Não autenticado ou token inválido
 *       500:
 *         description: Erro interno no servidor
 */
router.get('/', customerController.getCustomers);

/**
 * @openapi
 * /customers/{id}:
 *   put:
 *     summary: Atualiza os dados de um cliente existente
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente que será atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Maria Gasolina da Silva
 *               cpf:
 *                 type: string
 *                 example: 52998224725
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       400:
 *         description: Erro de validação nos dados
 *       401:
 *         description: Não autenticado ou token inválido
 *       404:
 *         description: Cliente não encontrado
 *       409:
 *         description: CPF já pertence a outro cliente
 *       500:
 *         description: Erro interno no servidor
 */
router.put('/:id', validateUpdateCustomer, customerController.updateCustomer);

/**
 * @openapi
 * /customers/{id}:
 *   delete:
 *     summary: Remove um cliente do sistema
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente que será deletado
 *     responses:
 *       204:
 *         description: Cliente deletado com sucesso (sem conteúdo)
 *       401:
 *         description: Não autenticado ou token inválido
 *       404:
 *         description: Cliente não encontrado
 *       500:
 *         description: Erro interno no servidor
 */
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
