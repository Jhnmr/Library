const express = require('express');
const router = express.Router();
const duplicateController = require('../controllers/duplicateController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Buscar duplicados (todos los usuarios)
router.get('/', duplicateController.findDuplicates);

// Resolver duplicados (requiere admin)
router.post('/resolve', requireAdmin, duplicateController.resolveDuplicates);

// Verificar integridad (requiere admin)
router.get('/integrity', requireAdmin, duplicateController.checkIntegrity);

// Limpiar archivos huérfanos (requiere admin)
router.get('/orphans', requireAdmin, duplicateController.cleanOrphans);

module.exports = router;
