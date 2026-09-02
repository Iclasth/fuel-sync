const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = 
{
    openapi: '3.0.0',
    info: {
        title: 'Fuel Sync API',
        version: '1.0.0',
        description: 'API para sincronização de dados de combustível',
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: 'Server URL'
        },   
    ], 
};

const options = {
    swaggerDefinition,
    apis: ['./src/routes/*.js'], // Caminho para os arquivos de rotas
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };