const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const fileController = require('../controllers/fileController');
const { authenticateToken, logAccess } = require('../middleware/auth');

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.storage.tempPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.storage.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    // Aquí podrías agregar filtros adicionales si lo deseas
    cb(null, true);
  }
});

// Todas las rutas requieren autenticación
router.use(authenticateToken);
router.use(logAccess);

// Rutas de archivos
router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/', fileController.getFiles);
router.get('/:id', fileController.getFileInfo);
router.get('/:id/download', fileController.downloadFile);
router.get('/:id/serve', fileController.serveFile);
router.delete('/:id', fileController.deleteFile);
router.put('/:id/move', fileController.moveFile);

module.exports = router;
