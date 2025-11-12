const jwt = require('jsonwebtoken');
const config = require('../config/config');
const database = require('../models/database');
const logger = require('../utils/logger');

/**
 * Middleware para verificar el token JWT
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no proporcionado.'
      });
    }

    // Verificar token
    jwt.verify(token, config.jwt.secret, async (err, decoded) => {
      if (err) {
        logger.security('Token inválido intentado', {
          ip: req.ip,
          error: err.message
        });

        return res.status(403).json({
          success: false,
          message: 'Token inválido o expirado.'
        });
      }

      // Obtener usuario de la base de datos
      const user = await database.get(
        'SELECT id, username, role FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (!user) {
        return res.status(403).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }

      req.user = user;
      next();
    });

  } catch (error) {
    logger.error('Error en middleware de autenticación', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Error en la autenticación.'
    });
  }
}

/**
 * Middleware para verificar rol de administrador
 */
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    logger.security('Intento de acceso no autorizado a recurso de admin', {
      userId: req.user?.id,
      ip: req.ip
    });

    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de administrador.'
    });
  }
}

/**
 * Middleware para registrar accesos
 */
async function logAccess(req, res, next) {
  if (req.user) {
    try {
      const action = `${req.method} ${req.path}`;
      const resource = req.path;

      await database.run(
        'INSERT INTO access_logs (user_id, action, resource, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, action, resource, req.ip, req.get('user-agent')]
      );
    } catch (error) {
      // No bloquear la petición si falla el log
      logger.error('Error al registrar acceso', { error: error.message });
    }
  }

  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
  logAccess
};
