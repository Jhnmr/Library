const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Estadísticas del usuario actual
router.get('/user', statsController.getUserStats);

// Estadísticas del sistema (requiere admin)
router.get('/system', requireAdmin, statsController.getSystemStats);

// Logs de acceso (requiere admin)
router.get('/logs', requireAdmin, statsController.getAccessLogs);

module.exports = router;
