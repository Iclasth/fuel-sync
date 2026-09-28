const aiService = require('./aiService');

async function predictEta(req, res, next) {
    try {
        const { orderId, station, destination, pendingDeliveries, customerName, setbackDescription } = req.body;
        
        const prediction = await aiService.predictEtaForOrder({
            orderId,
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