const express = require('express');
const cors = require('cors');
const { swaggerUi, swaggerSpec } = require('./config/swagger.js');
const errorHandler = require('./common/middlewares/errorHandler.js');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Documentação Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas dos módulos
const authRoutes = require('./modules/auth/authRoutes.js');
const customerRoutes = require('./modules/customers/customerRoutes.js');
const stationRoutes = require('./modules/stations/stationRoutes.js');
const courierRoutes = require('./modules/couriers/courierRoutes.js');
const catalogRoutes = require('./modules/catalog/catalogRoutes.js');
const orderRoutes = require('./modules/orders/orderRoutes.js');

app.use('/api/v1/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/api/v1/stations', stationRoutes);
app.use('/api/v1/couriers', courierRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/orders', orderRoutes);

// Middleware centralizado de tratamento de erros
app.use(errorHandler);

module.exports = app;