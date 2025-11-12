# 📚 Biblioteca Virtual - Sistema de Gestión de Archivos

Sistema completo de gestión de archivos tipo nube personal, diseñado para funcionar como servidor local con acceso desde dispositivos en la red local y opcionalmente desde internet.

## ✨ Características Principales

- 🔐 **Autenticación segura** con JWT y contraseñas cifradas (bcrypt)
- 📁 **Gestión de archivos** completa con soporte para múltiples tipos
- 🔍 **Detección de duplicados** automática mediante hash SHA256
- 📊 **Estadísticas detalladas** del uso del sistema
- 🎨 **Interfaz dark moderna** con tonos azules y grises
- 👥 **Sistema de roles** (Administrador y Usuario)
- 🖼️ **Vista previa** de imágenes, videos, audio y PDF
- 🌐 **Acceso en red local** con soporte para acceso remoto opcional
- 📱 **Diseño responsive** compatible con dispositivos móviles
- 🔄 **Gestión de carpetas** con estructura jerárquica

## 🛠️ Tecnologías Utilizadas

### Backend
- Node.js + Express
- SQLite (base de datos)
- JWT (autenticación)
- Bcrypt (cifrado de contraseñas)
- Multer (subida de archivos)

### Frontend
- HTML5
- CSS3 (tema dark personalizado)
- JavaScript puro (sin frameworks)
- Font Awesome (iconos)

## 📋 Requisitos Previos

- Node.js 14.x o superior
- npm 6.x o superior
- Sistema operativo: Windows, Linux o macOS

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd Library
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` y personaliza los valores:

```env
# Puerto del servidor
PORT=3000

# Secret para JWT (¡CÁMBIALO!)
JWT_SECRET=tu-secret-super-seguro-generado-aleatoriamente

# Ruta de almacenamiento principal
STORAGE_PATH=./storage/uploads

# Tamaño máximo de archivo (5GB por defecto)
MAX_FILE_SIZE=5368709120

# Rutas adicionales de discos duros (opcional)
# Ejemplo: ADDITIONAL_STORAGE=/mnt/disk1,/mnt/disk2,D:/Videos
ADDITIONAL_STORAGE=

# Acceso remoto
ENABLE_REMOTE_ACCESS=false
```

### 4. Crear el primer usuario administrador

```bash
npm run init-db
```

Sigue las instrucciones en pantalla para crear tu usuario administrador.

## ▶️ Iniciar el Servidor

### Modo Producción

```bash
npm start
```

### Modo Desarrollo (con auto-recarga)

```bash
npm run dev
```

El servidor se iniciará y mostrará:
- Puerto en el que está corriendo
- Direcciones IP locales para acceso en red
- Estado del acceso remoto

```
╔═══════════════════════════════════════════════════════════╗
║         BIBLIOTECA VIRTUAL - SERVIDOR LOCAL              ║
╚═══════════════════════════════════════════════════════════╝

✓ Conectado a la base de datos SQLite
✓ Tablas de base de datos creadas correctamente
✓ Servidor iniciado correctamente

═══════════════════════════════════════════════════════════
   Puerto: 3000
   Entorno: development
═══════════════════════════════════════════════════════════

🌐 Acceso Local:
   http://localhost:3000
   http://127.0.0.1:3000

🏠 Acceso en Red Local:
   http://192.168.1.100:3000 (eth0)

═══════════════════════════════════════════════════════════
   Presiona Ctrl+C para detener el servidor
═══════════════════════════════════════════════════════════
```

## 🌐 Acceso al Sistema

### Desde el mismo equipo
```
http://localhost:3000
```

### Desde otro dispositivo en la red local
```
http://[IP-DEL-SERVIDOR]:3000
```

Por ejemplo: `http://192.168.1.100:3000`

## 📱 Uso de la Aplicación

### 1. Login

Inicia sesión con el usuario administrador que creaste durante la instalación.

### 2. Subir Archivos

- Haz clic en "Subir Archivo"
- Selecciona el archivo desde tu dispositivo
- El sistema detectará automáticamente si el archivo ya existe (duplicado)

### 3. Organizar en Carpetas

- Crea carpetas con "Nueva Carpeta"
- Mueve archivos entre carpetas
- Navega por la estructura jerárquica

### 4. Buscar Archivos

- Usa la barra de búsqueda en el header
- Filtra por tipo de archivo (imágenes, videos, documentos, etc.)
- Ordena por fecha, nombre o tamaño

### 5. Ver Archivos

- Haz clic en cualquier archivo para ver su preview
- Soporta: imágenes, videos, audio y PDF
- Descarga o elimina desde el preview

### 6. Gestión de Duplicados

- Ve a la sección "Duplicados"
- El sistema mostrará grupos de archivos duplicados
- Elimina copias para recuperar espacio

### 7. Estadísticas

- Visualiza el espacio usado
- Ve archivos por tipo
- Revisa los archivos más recientes

### 8. Usuarios (Solo Admin)

- Crea nuevos usuarios
- Asigna roles (admin/user)
- Elimina usuarios

## 🔧 Configuración Avanzada

### Agregar Más Discos Duros

Edita el archivo `.env` y agrega rutas separadas por comas:

```env
ADDITIONAL_STORAGE=/mnt/disk1,/mnt/disk2,D:/Videos,E:/Documents
```

### Cambiar Puerto

```env
PORT=8080
```

### Aumentar Tamaño Máximo de Archivo

```env
# 10GB en bytes
MAX_FILE_SIZE=10737418240
```

### Habilitar Acceso Remoto

⚠️ **Importante**: Solo habilita el acceso remoto si sabes lo que estás haciendo y has implementado medidas de seguridad adicionales.

```env
ENABLE_REMOTE_ACCESS=true
REMOTE_DOMAIN=https://tu-dominio.com
```

## 🌍 Acceso Remoto Seguro

Para acceder desde internet de forma segura, se recomienda usar uno de estos métodos:

### 1. Cloudflare Tunnel (Recomendado)

- Gratuito y seguro
- No requiere abrir puertos
- Proporciona HTTPS automático

**Instalación:**
```bash
# Instalar cloudflared
# Visita: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Crear túnel
cloudflared tunnel login
cloudflared tunnel create biblioteca
cloudflared tunnel route dns biblioteca biblioteca.tu-dominio.com

# Configurar
nano ~/.cloudflared/config.yml
```

```yaml
tunnel: [TUNNEL-ID]
credentials-file: /root/.cloudflared/[TUNNEL-ID].json

ingress:
  - hostname: biblioteca.tu-dominio.com
    service: http://localhost:3000
  - service: http_status:404
```

```bash
# Ejecutar
cloudflared tunnel run biblioteca
```

### 2. DuckDNS (Para IP dinámica)

- Gratuito
- Actualiza automáticamente tu IP pública
- Fácil de configurar

Visita: https://www.duckdns.org/

### 3. Ngrok (Para pruebas temporales)

```bash
ngrok http 3000
```

## 📁 Estructura del Proyecto

```
Library/
├── backend/
│   ├── config/
│   │   └── config.js          # Configuración general
│   ├── controllers/
│   │   ├── authController.js  # Autenticación
│   │   ├── fileController.js  # Gestión de archivos
│   │   ├── folderController.js # Gestión de carpetas
│   │   ├── userController.js  # Gestión de usuarios
│   │   ├── statsController.js # Estadísticas
│   │   └── duplicateController.js # Duplicados
│   ├── middleware/
│   │   └── auth.js            # Middleware de autenticación
│   ├── models/
│   │   └── database.js        # Conexión a BD
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── file.routes.js
│   │   ├── folder.routes.js
│   │   ├── user.routes.js
│   │   ├── stats.routes.js
│   │   └── duplicate.routes.js
│   └── utils/
│       ├── fileHash.js        # Cálculo de hash
│       ├── logger.js          # Sistema de logs
│       └── initDatabase.js    # Inicialización de BD
├── frontend/
│   ├── css/
│   │   └── styles.css         # Estilos (tema dark)
│   ├── js/
│   │   ├── api.js             # Cliente API
│   │   ├── app.js             # Aplicación principal
│   │   ├── auth.js            # Autenticación
│   │   ├── files.js           # Gestión de archivos
│   │   ├── folders.js         # Gestión de carpetas
│   │   ├── stats.js           # Estadísticas
│   │   ├── duplicates.js      # Duplicados
│   │   ├── users.js           # Usuarios
│   │   ├── settings.js        # Configuración
│   │   └── ui.js              # Utilidades UI
│   └── index.html             # Página principal
├── storage/
│   ├── uploads/               # Archivos subidos
│   └── temp/                  # Archivos temporales
├── database/
│   └── library.db             # Base de datos SQLite
├── logs/                      # Logs del sistema
├── server.js                  # Servidor principal
├── package.json               # Dependencias
├── .env.example               # Ejemplo de configuración
└── README.md                  # Este archivo
```

## 🔐 Seguridad

### Características de Seguridad Implementadas

- ✅ Contraseñas cifradas con bcrypt (10 rounds)
- ✅ Autenticación con JWT
- ✅ Tokens con expiración configurable
- ✅ Protección contra fuerza bruta con rate limiting
- ✅ Validación de tamaño de archivos
- ✅ Detección de duplicados por hash
- ✅ Logs de acceso y auditoría
- ✅ Headers de seguridad con Helmet
- ✅ Validación de permisos por rol

### Recomendaciones Adicionales

1. **Cambia el JWT_SECRET** en `.env` por uno generado aleatoriamente
2. **Usa contraseñas fuertes** para todos los usuarios
3. **Mantén actualizado** Node.js y las dependencias
4. **Revisa los logs** regularmente en la carpeta `logs/`
5. **Limita el acceso** solo a dispositivos confiables
6. **Usa HTTPS** si habilitas acceso remoto
7. **Realiza backups** regulares de la carpeta `database/` y `storage/`

## 🔍 Detección de Duplicados

El sistema detecta automáticamente archivos duplicados mediante:

1. **Cálculo de hash SHA256** al subir cada archivo
2. **Comparación con archivos existentes** antes de guardar
3. **Vista de duplicados** que muestra grupos de archivos idénticos
4. **Eliminación inteligente** que mantiene el archivo original

## 📊 API REST

La aplicación expone una API REST completa:

### Endpoints Principales

```
POST   /api/auth/login              # Login
GET    /api/auth/me                 # Usuario actual

POST   /api/files/upload            # Subir archivo
GET    /api/files                   # Listar archivos
GET    /api/files/:id               # Info de archivo
GET    /api/files/:id/download      # Descargar
DELETE /api/files/:id               # Eliminar

GET    /api/folders                 # Listar carpetas
POST   /api/folders                 # Crear carpeta
DELETE /api/folders/:id             # Eliminar carpeta

GET    /api/stats/system            # Estadísticas del sistema
GET    /api/stats/user              # Estadísticas del usuario

GET    /api/duplicates              # Buscar duplicados
POST   /api/duplicates/resolve      # Resolver duplicados

GET    /api/users                   # Listar usuarios (admin)
POST   /api/users                   # Crear usuario (admin)
DELETE /api/users/:id               # Eliminar usuario (admin)
```

Todos los endpoints (excepto `/api/auth/login`) requieren autenticación mediante Bearer token.

## 🐛 Solución de Problemas

### El servidor no inicia

```bash
# Verifica que el puerto no esté en uso
lsof -i :3000

# O cambia el puerto en .env
PORT=8080
```

### Error al subir archivos grandes

Aumenta el límite en `.env`:
```env
MAX_FILE_SIZE=10737418240
```

### No puedo acceder desde otro dispositivo

1. Verifica que ambos dispositivos estén en la misma red
2. Verifica el firewall del servidor
3. Usa la IP correcta del servidor

```bash
# En Linux/Mac
ifconfig

# En Windows
ipconfig
```

### La base de datos está corrupta

```bash
# Eliminar base de datos (perderás los datos)
rm database/library.db

# Recrear
npm run init-db
```

## 🔄 Backup y Restauración

### Realizar Backup

```bash
# Crear carpeta de backup
mkdir backup_$(date +%Y%m%d)

# Copiar base de datos
cp database/library.db backup_$(date +%Y%m%d)/

# Copiar archivos
cp -r storage/uploads backup_$(date +%Y%m%d)/
```

### Restaurar Backup

```bash
# Detener el servidor
# Restaurar base de datos
cp backup_20240101/library.db database/

# Restaurar archivos
cp -r backup_20240101/uploads/* storage/uploads/
```

## 📝 Licencia

MIT License - Puedes usar, modificar y distribuir este software libremente.

## 🤝 Contribuciones

Este proyecto es de código abierto. Siéntete libre de hacer fork, modificar y mejorar.

## 📞 Soporte

Para reportar problemas o sugerir mejoras, crea un issue en el repositorio del proyecto.

## 🎉 ¡Disfruta de tu Biblioteca Virtual!

---

**Desarrollado con ❤️ para gestionar archivos de forma eficiente y segura.**
