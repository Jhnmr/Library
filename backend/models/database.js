const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

class Database {
  constructor() {
    this.db = null;
  }

  initialize() {
    return new Promise((resolve, reject) => {
      const dbDir = path.dirname(config.database.path);

      // Crear directorio si no existe
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new sqlite3.Database(config.database.path, (err) => {
        if (err) {
          console.error('Error al conectar a la base de datos:', err);
          reject(err);
        } else {
          console.log('✓ Conectado a la base de datos SQLite');
          this.createTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const schema = `
        -- Tabla de usuarios
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        );

        -- Tabla de archivos
        CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type TEXT NOT NULL,
          file_hash TEXT NOT NULL,
          folder_id INTEGER,
          uploaded_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
        );

        -- Tabla de carpetas
        CREATE TABLE IF NOT EXISTS folders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          parent_id INTEGER,
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
        );

        -- Tabla de logs de acceso
        CREATE TABLE IF NOT EXISTS access_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          resource TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Tabla de configuración del sistema
        CREATE TABLE IF NOT EXISTS system_config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Índices para mejorar el rendimiento
        CREATE INDEX IF NOT EXISTS idx_files_hash ON files(file_hash);
        CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
        CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
        CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
        CREATE INDEX IF NOT EXISTS idx_logs_user ON access_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_logs_created ON access_logs(created_at);
      `;

      this.db.exec(schema, (err) => {
        if (err) {
          console.error('Error al crear las tablas:', err);
          reject(err);
        } else {
          console.log('✓ Tablas de base de datos creadas correctamente');
          resolve();
        }
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✓ Conexión a la base de datos cerrada');
          resolve();
        }
      });
    });
  }
}

const database = new Database();

module.exports = database;
