const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
