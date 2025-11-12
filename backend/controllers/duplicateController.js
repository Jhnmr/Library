const fs = require('fs').promises;
const database = require('../models/database');
const logger = require('../utils/logger');
const { calculateFileHash } = require('../utils/fileHash');

/**
 * Buscar archivos duplicados
 */
async function findDuplicates(req, res) {
  try {
    // Buscar archivos con el mismo hash
    const duplicates = await database.all(`
      SELECT
        file_hash,
        COUNT(*) as count,
        GROUP_CONCAT(id) as file_ids,
        GROUP_CONCAT(original_name, '|||') as filenames,
        SUM(file_size) as total_wasted_space
      FROM files
      GROUP BY file_hash
      HAVING count > 1
      ORDER BY count DESC, total_wasted_space DESC
    `);

    // Formatear resultados
    const formattedDuplicates = await Promise.all(
      duplicates.map(async (dup) => {
        const ids = dup.file_ids.split(',').map(id => parseInt(id));
        const filenames = dup.filenames.split('|||');

        const files = await database.all(
          `SELECT
            f.*,
            u.username as uploaded_by_name,
            fo.name as folder_name
          FROM files f
          LEFT JOIN users u ON f.uploaded_by = u.id
          LEFT JOIN folders fo ON f.folder_id = fo.id
          WHERE f.id IN (${ids.join(',')})
          ORDER BY f.created_at ASC`
        );

        return {
          hash: dup.file_hash,
          count: dup.count,
          wasted_space: dup.total_wasted_space - files[0].file_size, // Espacio que se puede recuperar
          files
        };
      })
    );

    // Calcular totales
    const totalDuplicates = formattedDuplicates.reduce((sum, dup) => sum + (dup.count - 1), 0);
    const totalWastedSpace = formattedDuplicates.reduce((sum, dup) => sum + dup.wasted_space, 0);

    res.json({
      success: true,
      data: {
        duplicates: formattedDuplicates,
        summary: {
          duplicate_groups: formattedDuplicates.length,
          total_duplicate_files: totalDuplicates,
          total_wasted_space: totalWastedSpace
        }
      }
    });

  } catch (error) {
    logger.error('Error al buscar duplicados', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al buscar archivos duplicados.'
    });
  }
}

/**
 * Resolver duplicados (mantener uno y eliminar los demás)
 */
async function resolveDuplicates(req, res) {
  try {
    const { keepFileId, deleteFileIds } = req.body;

    if (!keepFileId || !Array.isArray(deleteFileIds) || deleteFileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere keepFileId y un array de deleteFileIds.'
      });
    }

    // Verificar que el archivo a mantener existe
    const keepFile = await database.get('SELECT * FROM files WHERE id = ?', [keepFileId]);

    if (!keepFile) {
      return res.status(404).json({
        success: false,
        message: 'El archivo a mantener no existe.'
      });
    }

    let deletedCount = 0;
    let freedSpace = 0;

    // Eliminar archivos duplicados
    for (const fileId of deleteFileIds) {
      if (parseInt(fileId) === parseInt(keepFileId)) {
        continue; // No eliminar el archivo que queremos mantener
      }

      const file = await database.get('SELECT * FROM files WHERE id = ?', [fileId]);

      if (file && file.file_hash === keepFile.file_hash) {
        // Eliminar archivo físico
        try {
          await fs.unlink(file.file_path);
        } catch (unlinkError) {
          logger.warn('No se pudo eliminar archivo físico duplicado', {
            fileId,
            path: file.file_path,
            error: unlinkError.message
          });
        }

        // Eliminar de la base de datos
        await database.run('DELETE FROM files WHERE id = ?', [fileId]);

        deletedCount++;
        freedSpace += file.file_size;

        logger.info('Archivo duplicado eliminado', {
          fileId,
          filename: file.original_name,
          keptFileId: keepFileId,
          deletedBy: req.user.id
        });
      }
    }

    res.json({
      success: true,
      message: `Se eliminaron ${deletedCount} archivo(s) duplicado(s).`,
      data: {
        deleted_count: deletedCount,
        freed_space: freedSpace
      }
    });

  } catch (error) {
    logger.error('Error al resolver duplicados', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al resolver archivos duplicados.'
    });
  }
}

/**
 * Verificar integridad de archivos
 */
async function checkIntegrity(req, res) {
  try {
    const files = await database.all('SELECT * FROM files');

    const results = {
      total: files.length,
      missing: [],
      corrupted: [],
      valid: 0
    };

    for (const file of files) {
      try {
        // Verificar si el archivo existe
        await fs.access(file.file_path);

        // Recalcular hash
        const currentHash = await calculateFileHash(file.file_path);

        if (currentHash !== file.file_hash) {
          results.corrupted.push({
            id: file.id,
            filename: file.original_name,
            path: file.file_path,
            reason: 'Hash no coincide'
          });
        } else {
          results.valid++;
        }

      } catch (error) {
        results.missing.push({
          id: file.id,
          filename: file.original_name,
          path: file.file_path,
          reason: 'Archivo no encontrado'
        });
      }
    }

    logger.info('Verificación de integridad completada', {
      total: results.total,
      valid: results.valid,
      missing: results.missing.length,
      corrupted: results.corrupted.length,
      checkedBy: req.user.id
    });

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    logger.error('Error al verificar integridad', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al verificar la integridad de los archivos.'
    });
  }
}

/**
 * Limpiar archivos huérfanos (archivos en disco sin registro en BD)
 */
async function cleanOrphans(req, res) {
  try {
    const config = require('../config/config');
    const path = require('path');

    // Obtener todos los archivos de la base de datos
    const dbFiles = await database.all('SELECT filename, file_path FROM files');
    const dbFilenames = new Set(dbFiles.map(f => f.filename));

    // Leer archivos del directorio de almacenamiento
    const fsFiles = await fs.readdir(config.storage.mainPath);

    const orphans = [];

    for (const filename of fsFiles) {
      if (filename === '.gitkeep') continue;

      if (!dbFilenames.has(filename)) {
        orphans.push({
          filename,
          path: path.join(config.storage.mainPath, filename)
        });
      }
    }

    // Si se solicita eliminación
    if (req.query.delete === 'true' && req.user.role === 'admin') {
      let deletedCount = 0;

      for (const orphan of orphans) {
        try {
          await fs.unlink(orphan.path);
          deletedCount++;
        } catch (error) {
          logger.error('Error al eliminar archivo huérfano', {
            path: orphan.path,
            error: error.message
          });
        }
      }

      logger.info('Archivos huérfanos eliminados', {
        count: deletedCount,
        deletedBy: req.user.id
      });

      res.json({
        success: true,
        message: `Se eliminaron ${deletedCount} archivo(s) huérfano(s).`,
        data: {
          deleted_count: deletedCount
        }
      });

    } else {
      res.json({
        success: true,
        data: {
          orphans,
          count: orphans.length
        }
      });
    }

  } catch (error) {
    logger.error('Error al limpiar archivos huérfanos', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al limpiar archivos huérfanos.'
    });
  }
}

module.exports = {
  findDuplicates,
  resolveDuplicates,
  checkIntegrity,
  cleanOrphans
};
