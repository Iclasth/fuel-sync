const express = require('express');
const authController = require('./authController');
const {
    validateCustomerSignup,
    validateLogin,
    validateCreateCourier
} = require('./authValidator');
const authMiddleware = require('../../common/middlewares/authMiddleware');
const authorizeRole = require('../../common/middlewares/roleMiddleware');

const router = express.Router();

router.post('/signup/customer', validateCustomerSignup, authController.signupCustomer);
router.post('/login', validateLogin, authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.post(
    '/admin/create-courier',
    authMiddleware,
    authorizeRole('posto_admin'),
    validateCreateCourier,
    authController.createCourier
);

module.exports = router;
