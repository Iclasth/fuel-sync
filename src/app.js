const express = require('express')
const { swaggerUi, swaggerSpec } = require('./config/swagger.js')
const app = express()

// Middleware. Converte de JSON para objeto JavaScript
// app.use(express.json())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.get('/', (req, res) => {
  res.send('Olá Mundo!')
})

// Facilita a importação do app em outros arquivos, como o server.js
module.exports = app