import express from 'express';
import { addCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer } from '../controllers/customerController.js';

const router = express.Router();

// Rota para criar um novo cliente
router.post('/customers', addCustomer);

// Rota para obter todos os clientes
router.get('/customers', getCustomers);

// Rota para obter um cliente específico pelo ID
router.get('/customers/:id', getCustomerById);

// Rota para atualizar um cliente existente pelo ID
router.put('/customers/:id', updateCustomer);

// Rota para excluir um cliente pelo ID
router.delete('/customers/:id', deleteCustomer);

export default router;