const express = require('express');
const { swaggerUi, swaggerSpec } = require('./config/swagger.js');
const errorHandler = require('./common/middlewares/errorHandler.js');

const app = express();

// Middleware para parsing de JSON
app.use(express.json());

// Documentação Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas dos módulos
const authRoutes = require('./modules/auth/authRoutes.js');
const customerRoutes = require('./modules/customers/customerRoutes.js');

app.use('/api/v1/auth', authRoutes);
app.use('/customers', customerRoutes);

// Middleware centralizado de tratamento de erros
app.use(errorHandler);

module.exports = app;