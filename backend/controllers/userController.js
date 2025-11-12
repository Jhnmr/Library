const bcrypt = require('bcryptjs');
const database = require('../models/database');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Obtener todos los usuarios (solo admin)
 */
async function getAllUsers(req, res) {
  try {
    const users = await database.all(
      'SELECT id, username, role, created_at, last_login FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    logger.error('Error al obtener usuarios', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de usuarios.'
    });
  }
}

/**
 * Crear nuevo usuario (solo admin)
 */
async function createUser(req, res) {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Usuario, contraseña y rol son requeridos.'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario debe tener al menos 3 caracteres.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres.'
      });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Debe ser "admin" o "user".'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await database.get(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El nombre de usuario ya existe.'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);

    // Crear usuario
    const result = await database.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );

    logger.info('Usuario creado', {
      newUserId: result.lastID,
      username,
      role,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente.',
      data: {
        user: {
          id: result.lastID,
          username,
          role
        }
      }
    });

  } catch (error) {
    logger.error('Error al crear usuario', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al crear el usuario.'
    });
  }
}

/**
 * Actualizar usuario (solo admin)
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;

    // Verificar que el usuario existe
    const user = await database.get('SELECT * FROM users WHERE id = ?', [id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    // No permitir que el admin se elimine sus propios privilegios
    if (parseInt(id) === req.user.id && role && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'No puedes cambiar tu propio rol de administrador.'
      });
    }

    const updates = [];
    const params = [];

    if (username && username !== user.username) {
      // Verificar que el nuevo username no exista
      const existingUser = await database.get(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'El nombre de usuario ya existe.'
        });
      }

      updates.push('username = ?');
      params.push(username);
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres.'
        });
      }

      const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (role && ['admin', 'user'].includes(role)) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay cambios para actualizar.'
      });
    }

    params.push(id);

    await database.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    logger.info('Usuario actualizado', {
      userId: id,
      updatedBy: req.user.id,
      changes: updates
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente.'
    });

  } catch (error) {
    logger.error('Error al actualizar usuario', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al actualizar el usuario.'
    });
  }
}

/**
 * Eliminar usuario (solo admin)
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // No permitir que el admin se elimine a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta.'
      });
    }

    // Verificar que el usuario existe
    const user = await database.get('SELECT * FROM users WHERE id = ?', [id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    await database.run('DELETE FROM users WHERE id = ?', [id]);

    logger.info('Usuario eliminado', {
      deletedUserId: id,
      deletedUsername: user.username,
      deletedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente.'
    });

  } catch (error) {
    logger.error('Error al eliminar usuario', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al eliminar el usuario.'
    });
  }
}

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
