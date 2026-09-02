const express = require('express');
const customerController = require('../controllers/customerController.js');
const { validateCreateCustomer, validateUpdateCustomer } = require('../middlewares/customerValidator.js');

const router = express.Router();

// Rota para criar um novo cliente
/**
 * @openapi
 * /customers:
 *   post:
 *     summary: Cadastra um novo cliente
 *     tags:
 *       - Customers
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
 *       409:
 *         description: CPF já cadastrado no sistema
 *       500:
 *         description: Erro interno no servidor
 */
router.post('/', validateCreateCustomer, customerController.createCustomer);

// Rota para obter todos os clientes
/**
 * @openapi
 * /customers:
 *   get:
 *     summary: Retorna a lista de todos os clientes
 *     tags:
 *       - Customers
 *     responses:
 *       200:
 *         description: Lista de clientes retornada com sucesso
 *       500:
 *         description: Erro interno no servidor
 */
router.get('/', customerController.getCustomers);

// Rota para atualizar um cliente existente pelo ID
/**
 * @openapi
 * /customers/{id}:
 *   put:
 *     summary: Atualiza os dados de um cliente existente
 *     tags:
 *       - Customers
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
 *       404:
 *         description: Cliente não encontrado
 *       409:
 *         description: CPF já pertence a outro cliente
 *       500:
 *         description: Erro interno no servidor
 */
router.put('/:id', validateUpdateCustomer, customerController.updateCustomer);

// Rota para excluir um cliente pelo ID
/**
 * @openapi
 * /customers/{id}:
 *   delete:
 *     summary: Remove um cliente do sistema
 *     tags:
 *       - Customers
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
 *       404:
 *         description: Cliente não encontrado
 *       500:
 *         description: Erro interno no servidor
 */
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;