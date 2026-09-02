const express = require('express')
const customerRoutes = require('./routes/customerRoutes.js')
const { swaggerUi, swaggerSpec } = require('./config/swagger.js')

const app = express()

// Middleware. Converte de JSON para objeto JavaScript
app.use(express.json())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/customers', customerRoutes);

// Facilita a importação do app em outros arquivos, como o server.js
module.exports = app