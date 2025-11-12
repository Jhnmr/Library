const database = require('../models/database');
const logger = require('../utils/logger');

/**
 * Obtener todas las carpetas
 */
async function getFolders(req, res) {
  try {
    const { parentId } = req.query;

    let query = `
      SELECT
        f.*,
        u.username as created_by_name,
        (SELECT COUNT(*) FROM files WHERE folder_id = f.id) as file_count,
        (SELECT COUNT(*) FROM folders WHERE parent_id = f.id) as subfolder_count
      FROM folders f
      LEFT JOIN users u ON f.created_by = u.id
    `;

    const params = [];

    if (parentId !== undefined) {
      if (parentId === 'null' || parentId === '') {
        query += ' WHERE f.parent_id IS NULL';
      } else {
        query += ' WHERE f.parent_id = ?';
        params.push(parentId);
      }
    }

    query += ' ORDER BY f.created_at DESC';

    const folders = await database.all(query, params);

    res.json({
      success: true,
      data: { folders }
    });

  } catch (error) {
    logger.error('Error al obtener carpetas', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de carpetas.'
    });
  }
}

/**
 * Crear carpeta
 */
async function createFolder(req, res) {
  try {
    const { name, parentId } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la carpeta es requerido.'
      });
    }

    // Verificar que el padre existe si se proporciona
    if (parentId && parentId !== 'null') {
      const parentFolder = await database.get(
        'SELECT * FROM folders WHERE id = ?',
        [parentId]
      );

      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Carpeta padre no encontrada.'
        });
      }
    }

    // Verificar que no existe una carpeta con el mismo nombre en el mismo nivel
    const existingFolder = await database.get(
      'SELECT id FROM folders WHERE name = ? AND parent_id IS ?',
      [name.trim(), parentId === 'null' ? null : parentId]
    );

    if (existingFolder) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una carpeta con ese nombre en esta ubicación.'
      });
    }

    const result = await database.run(
      'INSERT INTO folders (name, parent_id, created_by) VALUES (?, ?, ?)',
      [name.trim(), parentId === 'null' ? null : parentId, req.user.id]
    );

    logger.info('Carpeta creada', {
      folderId: result.lastID,
      name: name.trim(),
      parentId,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Carpeta creada exitosamente.',
      data: {
        folder: {
          id: result.lastID,
          name: name.trim(),
          parentId: parentId === 'null' ? null : parentId
        }
      }
    });

  } catch (error) {
    logger.error('Error al crear carpeta', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al crear la carpeta.'
    });
  }
}

/**
 * Obtener información de una carpeta
 */
async function getFolderInfo(req, res) {
  try {
    const { id } = req.params;

    const folder = await database.get(
      `SELECT
        f.*,
        u.username as created_by_name,
        (SELECT COUNT(*) FROM files WHERE folder_id = f.id) as file_count,
        (SELECT COUNT(*) FROM folders WHERE parent_id = f.id) as subfolder_count
      FROM folders f
      LEFT JOIN users u ON f.created_by = u.id
      WHERE f.id = ?`,
      [id]
    );

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Carpeta no encontrada.'
      });
    }

    res.json({
      success: true,
      data: { folder }
    });

  } catch (error) {
    logger.error('Error al obtener información de la carpeta', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al obtener información de la carpeta.'
    });
  }
}

/**
 * Actualizar carpeta
 */
async function updateFolder(req, res) {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;

    const folder = await database.get('SELECT * FROM folders WHERE id = ?', [id]);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Carpeta no encontrada.'
      });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la carpeta es requerido.'
      });
    }

    // Verificar que no se intenta mover a sí misma como hijo
    if (parentId && parseInt(parentId) === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Una carpeta no puede ser su propia carpeta padre.'
      });
    }

    // Verificar que el nuevo padre existe
    if (parentId && parentId !== 'null') {
      const parentFolder = await database.get(
        'SELECT * FROM folders WHERE id = ?',
        [parentId]
      );

      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Carpeta padre no encontrada.'
        });
      }

      // Verificar que no se cree un ciclo (la carpeta padre no puede ser descendiente de la actual)
      const isDescendant = await checkIfDescendant(id, parentId);
      if (isDescendant) {
        return res.status(400).json({
          success: false,
          message: 'No se puede mover la carpeta a uno de sus descendientes.'
        });
      }
    }

    // Verificar duplicados
    const existingFolder = await database.get(
      'SELECT id FROM folders WHERE name = ? AND parent_id IS ? AND id != ?',
      [name.trim(), parentId === 'null' ? null : parentId, id]
    );

    if (existingFolder) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una carpeta con ese nombre en esta ubicación.'
      });
    }

    await database.run(
      'UPDATE folders SET name = ?, parent_id = ? WHERE id = ?',
      [name.trim(), parentId === 'null' ? null : parentId, id]
    );

    logger.info('Carpeta actualizada', {
      folderId: id,
      newName: name.trim(),
      newParentId: parentId,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Carpeta actualizada exitosamente.'
    });

  } catch (error) {
    logger.error('Error al actualizar carpeta', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al actualizar la carpeta.'
    });
  }
}

/**
 * Eliminar carpeta
 */
async function deleteFolder(req, res) {
  try {
    const { id } = req.params;
    const { force } = req.query; // force=true para eliminar aunque tenga contenido

    const folder = await database.get('SELECT * FROM folders WHERE id = ?', [id]);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Carpeta no encontrada.'
      });
    }

    // Contar archivos y subcarpetas
    const { file_count } = await database.get(
      'SELECT COUNT(*) as file_count FROM files WHERE folder_id = ?',
      [id]
    );

    const { subfolder_count } = await database.get(
      'SELECT COUNT(*) as subfolder_count FROM folders WHERE parent_id = ?',
      [id]
    );

    if ((file_count > 0 || subfolder_count > 0) && force !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'La carpeta contiene archivos o subcarpetas. Use force=true para eliminar todo el contenido.',
        data: {
          file_count,
          subfolder_count
        }
      });
    }

    // Eliminar carpeta (CASCADE eliminará subcarpetas y archivos)
    await database.run('DELETE FROM folders WHERE id = ?', [id]);

    logger.info('Carpeta eliminada', {
      folderId: id,
      name: folder.name,
      deletedBy: req.user.id,
      forced: force === 'true'
    });

    res.json({
      success: true,
      message: 'Carpeta eliminada exitosamente.'
    });

  } catch (error) {
    logger.error('Error al eliminar carpeta', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al eliminar la carpeta.'
    });
  }
}

/**
 * Obtener ruta completa de una carpeta (breadcrumb)
 */
async function getFolderPath(req, res) {
  try {
    const { id } = req.params;

    const path = [];
    let currentId = id;

    while (currentId) {
      const folder = await database.get(
        'SELECT id, name, parent_id FROM folders WHERE id = ?',
        [currentId]
      );

      if (!folder) break;

      path.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parent_id;
    }

    res.json({
      success: true,
      data: { path }
    });

  } catch (error) {
    logger.error('Error al obtener ruta de carpeta', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al obtener la ruta de la carpeta.'
    });
  }
}

/**
 * Función auxiliar: verificar si una carpeta es descendiente de otra
 */
async function checkIfDescendant(parentId, childId) {
  let currentId = childId;

  while (currentId) {
    if (parseInt(currentId) === parseInt(parentId)) {
      return true;
    }

    const folder = await database.get(
      'SELECT parent_id FROM folders WHERE id = ?',
      [currentId]
    );

    if (!folder || !folder.parent_id) break;

    currentId = folder.parent_id;
  }

  return false;
}

module.exports = {
  getFolders,
  createFolder,
  getFolderInfo,
  updateFolder,
  deleteFolder,
  getFolderPath
};
