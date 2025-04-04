const express = require('express');
const router = express.Router();
const { register, login, changePassword, deleteAccount,usage, getSubscriptionStatus, updateSubscription, cancelSubscription } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', authenticateToken, changePassword);
router.post('/delete-account', authenticateToken, deleteAccount);
router.get('/usage', authenticateToken, usage);

router.get('/subscription',authenticateToken,getSubscriptionStatus);
router.post('/subscription',authenticateToken,updateSubscription);
router.post('/subscription/cancel', authenticateToken, cancelSubscription);

module.exports = router; 