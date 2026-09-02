const express = require('express');
const customerRoutes = require('./routes/customerRoutes.js');
const { swaggerUi, swaggerSpec } = require('./config/swagger.js');
const errorHandler = require('./middlewares/errorHandler.js');

const app = express();

// Middleware para parsing de JSON
app.use(express.json());

// Documentação Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas do módulo de Clientes
app.use('/customers', customerRoutes);

// Middleware centralizado de tratamento de erros
app.use(errorHandler);

module.exports = app;