require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const config = require('./backend/config/config');
const database = require('./backend/models/database');
const logger = require('./backend/utils/logger');

// Importar rutas
const authRoutes = require('./backend/routes/auth.routes');
const userRoutes = require('./backend/routes/user.routes');
const fileRoutes = require('./backend/routes/file.routes');
const folderRoutes = require('./backend/routes/folder.routes');
const statsRoutes = require('./backend/routes/stats.routes');
const duplicateRoutes = require('./backend/routes/duplicate.routes');

// Crear aplicación Express
const app = express();

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Desactivar para permitir inline scripts en desarrollo
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.'
  }
});

app.use('/api/', limiter);

// Parseo de body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (frontend)
app.use(express.static(path.join(__dirname, 'frontend')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/duplicates', duplicateRoutes);

// Ruta de información del servidor
app.get('/api/server-info', (req, res) => {
  const networkInfo = config.getNetworkInfo();

  res.json({
    success: true,
    data: {
      version: '1.0.0',
      environment: config.env,
      networkInterfaces: networkInfo,
      remoteAccess: config.remote.enabled,
      storage: {
        mainPath: config.storage.mainPath,
        additionalPaths: config.storage.additionalPaths,
        maxFileSize: config.storage.maxFileSize
      }
    }
  });
});

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Servir el frontend para cualquier otra ruta (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Manejador de errores global
app.use((err, req, res, next) => {
  logger.error('Error no manejado', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    success: false,
    message: config.env === 'development' ? err.message : 'Error interno del servidor.',
    ...(config.env === 'development' && { stack: err.stack })
  });
});

// Función para asegurar que existen los directorios necesarios
function ensureDirectories() {
  const directories = [
    config.storage.mainPath,
    config.storage.tempPath,
    config.logs.path
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Directorio creado: ${dir}`);
    }
  });
}

// Inicializar servidor
async function startServer() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║         BIBLIOTECA VIRTUAL - SERVIDOR LOCAL              ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Crear directorios necesarios
    ensureDirectories();

    // Inicializar base de datos
    await database.initialize();

    // Verificar si existe al menos un usuario
    const userCount = await database.get('SELECT COUNT(*) as count FROM users');

    if (userCount.count === 0) {
      console.log('\n⚠️  ATENCIÓN: No hay usuarios en el sistema.');
      console.log('   Ejecuta: npm run init-db para crear el primer usuario administrador.\n');
    }

    // Iniciar servidor
    const server = app.listen(config.port, () => {
      console.log('✓ Servidor iniciado correctamente\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`   Puerto: ${config.port}`);
      console.log(`   Entorno: ${config.env}`);
      console.log('═══════════════════════════════════════════════════════════\n');

      console.log('🌐 Acceso Local:');
      console.log(`   http://localhost:${config.port}`);
      console.log(`   http://127.0.0.1:${config.port}\n`);

      const networkInfo = config.getNetworkInfo();

      if (networkInfo.length > 0) {
        console.log('🏠 Acceso en Red Local:');
        networkInfo.forEach(iface => {
          console.log(`   http://${iface.address}:${config.port} (${iface.name})`);
        });
        console.log('');
      }

      if (config.remote.enabled) {
        console.log('🌍 Acceso Remoto: HABILITADO');
        if (config.remote.domain) {
          console.log(`   ${config.remote.domain}`);
        }
        console.log('');
      }

      console.log('═══════════════════════════════════════════════════════════');
      console.log('   Presiona Ctrl+C para detener el servidor');
      console.log('═══════════════════════════════════════════════════════════\n');

      logger.info('Servidor iniciado', {
        port: config.port,
        env: config.env
      });
    });

    // Manejo de cierre graceful
    const gracefulShutdown = async (signal) => {
      console.log(`\n\n⚠️  Señal ${signal} recibida. Cerrando servidor...`);

      server.close(async () => {
        console.log('✓ Servidor HTTP cerrado');

        try {
          await database.close();
          console.log('✓ Conexión a base de datos cerrada');
        } catch (error) {
          console.error('Error al cerrar la base de datos:', error);
        }

        console.log('✓ Aplicación cerrada correctamente\n');
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⚠️  Forzando cierre del servidor...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('\n❌ Error al iniciar el servidor:', error.message);
    logger.error('Error al iniciar servidor', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Iniciar la aplicación
startServer();
