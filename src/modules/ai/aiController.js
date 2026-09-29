const aiService = require('./aiService');

async function predictEta(req, res, next) {
    try {
        const {
            orderId,
            deliveryId,
            station,
            destination,
            pendingDeliveries,
            customerName,
            setbackDescription
        } = req.body;

        if (!station || !destination) {
            return res.status(400).json({
                status: 'fail',
                message: 'Dados de posto e destino são obrigatórios para o cálculo de ETA.'
            });
        }

        const prediction = await aiService.predictEtaForOrder({
            orderId,
            deliveryId,
            station,
            destination,
            pendingDeliveries,
            customerName,
            setbackDescription
        });

        return res.status(201).json({ status: 'success', data: prediction });
    } catch (error) {
        next(error);
    }
}

module.exports = { predictEta };