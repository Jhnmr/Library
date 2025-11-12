const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../models/database');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Login de usuario
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos.'
      });
    }

    // Buscar usuario
    const user = await database.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      logger.security('Intento de login con usuario inexistente', {
        username,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.'
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      logger.security('Intento de login con contraseña incorrecta', {
        userId: user.id,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas.'
      });
    }

    // Actualizar último login
    await database.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Crear token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    logger.info('Login exitoso', {
      userId: user.id,
      username: user.username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Login exitoso.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    });

  } catch (error) {
    logger.error('Error en login', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al procesar el login.'
    });
  }
}

/**
 * Obtener información del usuario actual
 */
async function getCurrentUser(req, res) {
  try {
    const user = await database.get(
      'SELECT id, username, role, created_at, last_login FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    logger.error('Error al obtener usuario actual', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al obtener información del usuario.'
    });
  }
}

/**
 * Cambiar contraseña
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son requeridas.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres.'
      });
    }

    // Obtener usuario con contraseña
    const user = await database.get(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta.'
      });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.rounds);

    // Actualizar contraseña
    await database.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    logger.info('Contraseña cambiada', {
      userId: req.user.id,
      username: req.user.username
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente.'
    });

  } catch (error) {
    logger.error('Error al cambiar contraseña', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Error al cambiar la contraseña.'
    });
  }
}

module.exports = {
  login,
  getCurrentUser,
  changePassword
};
