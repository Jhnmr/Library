const database = require('../models/database');
const logger = require('../utils/logger');
const config = require('../config/config');
const fs = require('fs').promises;
const os = require('os');

/**
 * Obtener estadísticas generales del sistema
 */
async function getSystemStats(req, res) {
  try {
    // Total de archivos
    const { total_files } = await database.get(
      'SELECT COUNT(*) as total_files FROM files'
    );

    // Total de carpetas
    const { total_folders } = await database.get(
      'SELECT COUNT(*) as total_folders FROM folders'
    );

    // Total de usuarios
    const { total_users } = await database.get(
      'SELECT COUNT(*) as total_users FROM users'
    );

    // Espacio total usado
    const { total_size } = await database.get(
      'SELECT SUM(file_size) as total_size FROM files'
    );

    // Archivos por tipo
    const filesByType = await database.all(`
      SELECT
        CASE
          WHEN mime_type LIKE 'image/%' THEN 'Imágenes'
          WHEN mime_type LIKE 'video/%' THEN 'Videos'
          WHEN mime_type LIKE 'audio/%' THEN 'Audio'
          WHEN mime_type LIKE 'application/pdf' THEN 'PDF'
          WHEN mime_type LIKE 'application/%' THEN 'Documentos'
          WHEN mime_type LIKE 'text/%' THEN 'Texto'
          ELSE 'Otros'
        END as category,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM files
      GROUP BY category
      ORDER BY count DESC
    `);

    // Archivos subidos recientemente
    const recentFiles = await database.all(`
      SELECT
        f.id,
        f.original_name,
        f.file_size,
        f.mime_type,
        f.created_at,
        u.username as uploaded_by_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      ORDER BY f.created_at DESC
      LIMIT 10
    `);

    // Usuarios más activos
    const topUsers = await database.all(`
      SELECT
        u.id,
        u.username,
        COUNT(f.id) as file_count,
        SUM(f.file_size) as total_size
      FROM users u
      LEFT JOIN files f ON u.id = f.uploaded_by
      GROUP BY u.id, u.username
      ORDER BY file_count DESC
      LIMIT 5
    `);

    // Información del servidor
    const storageInfo = await getStorageInfo();

    res.json({
      success: true,
      data: {
        summary: {
          total_files,
          total_folders,
          total_users,
          total_size: total_size || 0
        },
        filesByType,
        recentFiles,
        topUsers,
        storage: storageInfo,
        server: {
          uptime: os.uptime(),
          platform: os.platform(),
          arch: os.arch(),
          memory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem()
          }
        }
      }
    });

  } catch (error) {
    logger.error('Error al obtener estadísticas', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas del sistema.'
    });
  }
}

/**
 * Obtener estadísticas de uso de almacenamiento
 */
async function getStorageInfo() {
  try {
    const mainPath = config.storage.mainPath;

    // Nota: En producción, considerar usar una librería como 'diskusage' para obtener info del disco
    const stats = {
      mainPath,
      available: true
    };

    try {
      await fs.access(mainPath);
    } catch {
      stats.available = false;
    }

    return stats;

  } catch (error) {
    logger.error('Error al obtener información de almacenamiento', { error: error.message });
    return {
      available: false,
      error: error.message
    };
  }
}

/**
 * Obtener logs de acceso recientes
 */
async function getAccessLogs(req, res) {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const logs = await database.all(
      `SELECT
        al.*,
        u.username
      FROM access_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const { total } = await database.get(
      'SELECT COUNT(*) as total FROM access_logs'
    );

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });

  } catch (error) {
    logger.error('Error al obtener logs de acceso', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al obtener los logs de acceso.'
    });
  }
}

/**
 * Obtener estadísticas de un usuario específico
 */
async function getUserStats(req, res) {
  try {
    const userId = req.user.id;

    // Total de archivos del usuario
    const { file_count } = await database.get(
      'SELECT COUNT(*) as file_count FROM files WHERE uploaded_by = ?',
      [userId]
    );

    // Espacio usado por el usuario
    const { total_size } = await database.get(
      'SELECT SUM(file_size) as total_size FROM files WHERE uploaded_by = ?',
      [userId]
    );

    // Archivos del usuario por tipo
    const filesByType = await database.all(`
      SELECT
        CASE
          WHEN mime_type LIKE 'image/%' THEN 'Imágenes'
          WHEN mime_type LIKE 'video/%' THEN 'Videos'
          WHEN mime_type LIKE 'audio/%' THEN 'Audio'
          WHEN mime_type LIKE 'application/pdf' THEN 'PDF'
          WHEN mime_type LIKE 'application/%' THEN 'Documentos'
          WHEN mime_type LIKE 'text/%' THEN 'Texto'
          ELSE 'Otros'
        END as category,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM files
      WHERE uploaded_by = ?
      GROUP BY category
      ORDER BY count DESC
    `, [userId]);

    // Archivos recientes del usuario
    const recentFiles = await database.all(
      `SELECT
        id,
        original_name,
        file_size,
        mime_type,
        created_at
      FROM files
      WHERE uploaded_by = ?
      ORDER BY created_at DESC
      LIMIT 5`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        file_count,
        total_size: total_size || 0,
        filesByType,
        recentFiles
      }
    });

  } catch (error) {
    logger.error('Error al obtener estadísticas del usuario', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas del usuario.'
    });
  }
}

module.exports = {
  getSystemStats,
  getAccessLogs,
  getUserStats
};
