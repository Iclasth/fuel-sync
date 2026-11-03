const app = require('./src/app.js')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
    console.log(`Acesse a documentação da API em http://localhost:${PORT}/api-docs`)
})