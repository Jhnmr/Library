require('dotenv').config();
const path = require('path');
const os = require('os');

const config = {
  // Servidor
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',

  // Base de datos
  database: {
    path: process.env.DB_PATH || path.join(__dirname, '../../database/library.db')
  },

  // Seguridad
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-this',
    expiresIn: process.env.JWT_EXPIRE || '24h'
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 10
  },

  // Almacenamiento
  storage: {
    mainPath: process.env.STORAGE_PATH || path.join(__dirname, '../../storage/uploads'),
    tempPath: path.join(__dirname, '../../storage/temp'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5368709120, // 5GB
    additionalPaths: process.env.ADDITIONAL_STORAGE
      ? process.env.ADDITIONAL_STORAGE.split(',').map(p => p.trim())
      : []
  },

  // Acceso
  remote: {
    enabled: process.env.ENABLE_REMOTE_ACCESS === 'true',
    domain: process.env.REMOTE_DOMAIN || ''
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Logs
  logs: {
    level: process.env.LOG_LEVEL || 'info',
    path: path.join(__dirname, '../../logs')
  },

  // Información del sistema
  getNetworkInfo: () => {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({
            name,
            address: iface.address,
            netmask: iface.netmask
          });
        }
      }
    }

    return addresses;
  }
};

module.exports = config;
