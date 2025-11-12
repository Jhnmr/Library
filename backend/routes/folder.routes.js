const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const { authenticateToken, logAccess } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);
router.use(logAccess);

router.get('/', folderController.getFolders);
router.post('/', folderController.createFolder);
router.get('/:id', folderController.getFolderInfo);
router.get('/:id/path', folderController.getFolderPath);
router.put('/:id', folderController.updateFolder);
router.delete('/:id', folderController.deleteFolder);

module.exports = router;
