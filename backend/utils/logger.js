const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class Logger {
  constructor() {
    this.logsDir = config.logs.path;
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getLogFilePath(type = 'app') {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logsDir, `${type}-${date}.log`);
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}\n`;
  }

  writeLog(level, message, meta = {}, type = 'app') {
    const logMessage = this.formatMessage(level, message, meta);
    const logPath = this.getLogFilePath(type);

    fs.appendFile(logPath, logMessage, (err) => {
      if (err) {
        console.error('Error al escribir en el log:', err);
      }
    });

    // También mostrar en consola en desarrollo
    if (config.env === 'development') {
      console.log(logMessage.trim());
    }
  }

  info(message, meta = {}) {
    this.writeLog('info', message, meta);
  }

  error(message, meta = {}) {
    this.writeLog('error', message, meta);
  }

  warn(message, meta = {}) {
    this.writeLog('warn', message, meta);
  }

  debug(message, meta = {}) {
    if (config.env === 'development') {
      this.writeLog('debug', message, meta);
    }
  }

  access(userId, action, resource, ip, userAgent) {
    const meta = {
      userId,
      action,
      resource,
      ip,
      userAgent
    };
    this.writeLog('access', `User ${userId} performed ${action}`, meta, 'access');
  }

  security(message, meta = {}) {
    this.writeLog('security', message, meta, 'security');
  }
}

const logger = new Logger();

module.exports = logger;
