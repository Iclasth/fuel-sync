function generateFallbackPrediction(metrics, setbackDescription = null) {
    const temRisco = Boolean(setbackDescription) || metrics.tempo_espera > 25;
    
    let mensagem = `Seu pedido está em processamento. Previsão estimada de entrega em aproximadamente ${metrics.total_minutos} minutos.`;
    
    if (setbackDescription) {
        mensagem = `Atenção: Ocorreu um evento durante a rota (${setbackDescription}). Nova previsão de chegada em ${metrics.total_minutos} minutos.`;
    }

    return {
        confianca: temRisco ? 75 : 90,
        risco_atraso: temRisco,
        motivo_risco: setbackDescription || (temRisco ? 'Fila de espera elevada no posto' : null),
        mensagem: mensagem
    };
}

module.exports = { generateFallbackPrediction };