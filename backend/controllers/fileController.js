const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');
const database = require('../models/database');
const config = require('../config/config');
const logger = require('../utils/logger');
const { calculateFileHash } = require('../utils/fileHash');

/**
 * Subir archivo
 */
async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo.'
      });
    }

    const file = req.file;
    const folderId = req.body.folderId || null;

    // Calcular hash del archivo
    const fileHash = await calculateFileHash(file.path);

    // Verificar si el archivo ya existe
    const existingFile = await database.get(
      'SELECT * FROM files WHERE file_hash = ?',
      [fileHash]
    );

    if (existingFile) {
      // Eliminar archivo temporal
      await fs.unlink(file.path);

      return res.status(409).json({
        success: false,
        message: 'El archivo ya existe en el sistema.',
        data: {
          existingFile: {
            id: existingFile.id,
            filename: existingFile.original_name,
            uploadedAt: existingFile.created_at
          }
        }
      });
    }

    // Generar nombre único para el archivo
    const ext = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${ext}`;
    const finalPath = path.join(config.storage.mainPath, uniqueFilename);

    // Mover archivo a la ubicación final
    await fs.rename(file.path, finalPath);

    // Guardar información en la base de datos
    const result = await database.run(
      `INSERT INTO files (filename, original_name, file_path, file_size, mime_type, file_hash, folder_id, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uniqueFilename,
        file.originalname,
        finalPath,
        file.size,
        file.mimetype,
        fileHash,
        folderId,
        req.user.id
      ]
    );

    logger.info('Archivo subido', {
      fileId: result.lastID,
      filename: file.originalname,
      size: file.size,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Archivo subido exitosamente.',
      data: {
        file: {
          id: result.lastID,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype
        }
      }
    });

  } catch (error) {
    logger.error('Error al subir archivo', { error: error.message });

    // Limpiar archivo temporal si existe
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        // Ignorar error si el archivo no existe
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error al subir el archivo.'
    });
  }
}

/**
 * Obtener lista de archivos
 */
async function getFiles(req, res) {
  try {
    const { folderId, search, type, sortBy = 'created_at', order = 'DESC', limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT
        f.*,
        u.username as uploaded_by_name,
        fo.name as folder_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      LEFT JOIN folders fo ON f.folder_id = fo.id
      WHERE 1=1
    `;

    const params = [];

    if (folderId !== undefined) {
      if (folderId === 'null' || folderId === '') {
        query += ' AND f.folder_id IS NULL';
      } else {
        query += ' AND f.folder_id = ?';
        params.push(folderId);
      }
    }

    if (search) {
      query += ' AND f.original_name LIKE ?';
      params.push(`%${search}%`);
    }

    if (type) {
      query += ' AND f.mime_type LIKE ?';
      params.push(`${type}%`);
    }

    // Validar campos de ordenamiento
    const validSortFields = ['original_name', 'file_size', 'created_at', 'mime_type'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY f.${sortField} ${sortOrder}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const files = await database.all(query, params);

    // Obtener total de archivos
    let countQuery = 'SELECT COUNT(*) as total FROM files WHERE 1=1';
    const countParams = [];

    if (folderId !== undefined) {
      if (folderId === 'null' || folderId === '') {
        countQuery += ' AND folder_id IS NULL';
      } else {
        countQuery += ' AND folder_id = ?';
        countParams.push(folderId);
      }
    }

    if (search) {
      countQuery += ' AND original_name LIKE ?';
      countParams.push(`%${search}%`);
    }

    if (type) {
      countQuery += ' AND mime_type LIKE ?';
      countParams.push(`${type}%`);
    }

    const { total } = await database.get(countQuery, countParams);

    res.json({
      success: true,
      data: {
        files,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + files.length < total
        }
      }
    });

  } catch (error) {
    logger.error('Error al obtener archivos', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de archivos.'
    });
  }
}

/**
 * Obtener información de un archivo
 */
async function getFileInfo(req, res) {
  try {
    const { id } = req.params;

    const file = await database.get(
      `SELECT
        f.*,
        u.username as uploaded_by_name,
        fo.name as folder_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      LEFT JOIN folders fo ON f.folder_id = fo.id
      WHERE f.id = ?`,
      [id]
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado.'
      });
    }

    res.json({
      success: true,
      data: { file }
    });

  } catch (error) {
    logger.error('Error al obtener información del archivo', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al obtener información del archivo.'
    });
  }
}

/**
 * Descargar archivo
 */
async function downloadFile(req, res) {
  try {
    const { id } = req.params;

    const file = await database.get('SELECT * FROM files WHERE id = ?', [id]);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado.'
      });
    }

    // Verificar que el archivo existe en el sistema
    if (!fsSync.existsSync(file.file_path)) {
      logger.error('Archivo no existe en el sistema de archivos', {
        fileId: id,
        path: file.file_path
      });

      return res.status(404).json({
        success: false,
        message: 'El archivo no existe en el sistema de archivos.'
      });
    }

    logger.access(req.user.id, 'download', `file:${id}`, req.ip, req.get('user-agent'));

    res.download(file.file_path, file.original_name);

  } catch (error) {
    logger.error('Error al descargar archivo', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al descargar el archivo.'
    });
  }
}

/**
 * Servir archivo para preview
 */
async function serveFile(req, res) {
  try {
    const { id } = req.params;

    const file = await database.get('SELECT * FROM files WHERE id = ?', [id]);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado.'
      });
    }

    // Verificar que el archivo existe
    if (!fsSync.existsSync(file.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'El archivo no existe en el sistema de archivos.'
      });
    }

    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', 'inline');

    const fileStream = fsSync.createReadStream(file.file_path);
    fileStream.pipe(res);

  } catch (error) {
    logger.error('Error al servir archivo', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al servir el archivo.'
    });
  }
}

/**
 * Eliminar archivo
 */
async function deleteFile(req, res) {
  try {
    const { id } = req.params;

    const file = await database.get('SELECT * FROM files WHERE id = ?', [id]);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado.'
      });
    }

    // Verificar permisos: solo el usuario que subió el archivo o un admin puede eliminarlo
    if (file.uploaded_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este archivo.'
      });
    }

    // Eliminar archivo físico
    try {
      await fs.unlink(file.file_path);
    } catch (unlinkError) {
      logger.warn('No se pudo eliminar el archivo físico', {
        fileId: id,
        path: file.file_path,
        error: unlinkError.message
      });
    }

    // Eliminar registro de la base de datos
    await database.run('DELETE FROM files WHERE id = ?', [id]);

    logger.info('Archivo eliminado', {
      fileId: id,
      filename: file.original_name,
      deletedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente.'
    });

  } catch (error) {
    logger.error('Error al eliminar archivo', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al eliminar el archivo.'
    });
  }
}

/**
 * Mover archivo a otra carpeta
 */
async function moveFile(req, res) {
  try {
    const { id } = req.params;
    const { folderId } = req.body;

    const file = await database.get('SELECT * FROM files WHERE id = ?', [id]);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado.'
      });
    }

    // Verificar que la carpeta existe si se proporciona
    if (folderId && folderId !== 'null') {
      const folder = await database.get('SELECT * FROM folders WHERE id = ?', [folderId]);

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Carpeta destino no encontrada.'
        });
      }
    }

    await database.run(
      'UPDATE files SET folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [folderId === 'null' ? null : folderId, id]
    );

    logger.info('Archivo movido', {
      fileId: id,
      newFolderId: folderId,
      movedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Archivo movido exitosamente.'
    });

  } catch (error) {
    logger.error('Error al mover archivo', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al mover el archivo.'
    });
  }
}

module.exports = {
  uploadFile,
  getFiles,
  getFileInfo,
  downloadFile,
  serveFile,
  deleteFile,
  moveFile
};
