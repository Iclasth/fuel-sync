const express = require('express');
const router = express.Router();
const aiController = require('./aiController');
const authMiddleware = require('../../common/middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/predict-eta', aiController.predictEta);

module.exports = router;