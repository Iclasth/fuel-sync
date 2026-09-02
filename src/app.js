const express = require('express')
const app = express()

// Middleware. Converte de JSON para objeto JavaScript
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Olá Mundo!')
})

// Facilita a importação do app em outros arquivos, como o server.js
module.exports = app