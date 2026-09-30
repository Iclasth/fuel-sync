const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV !== 'test') {
        console.error('🔴 Erro na aplicação:', err);
    }

    const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
    
    res.status(statusCode).json({
        error: err.message || 'Erro interno do servidor',
        ...(err.details && { details: err.details }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
