# 🚀 Inicio Rápido - Biblioteca Virtual

## Instalación en 3 Pasos

### 1️⃣ Instalar Dependencias
```bash
npm install
```

### 2️⃣ Crear Usuario Administrador
```bash
npm run init-db
```

Ingresa:
- **Usuario**: admin (o el que prefieras)
- **Contraseña**: (mínimo 6 caracteres)

### 3️⃣ Iniciar Servidor
```bash
npm start
```

## 🌐 Acceder al Sistema

### Desde la misma PC:
```
http://localhost:3000
```

### Desde otro dispositivo en la red:
```
http://[IP-DE-TU-PC]:3000
```

Para saber tu IP:
- **Windows**: Abre CMD y escribe `ipconfig`
- **Linux/Mac**: Abre terminal y escribe `ifconfig` o `ip addr`

Busca tu IP local (generalmente comienza con 192.168.x.x)

## 📱 Primer Uso

1. **Inicia sesión** con el usuario y contraseña que creaste
2. **Sube tu primer archivo** con el botón "Subir Archivo"
3. **Crea carpetas** para organizar tus archivos
4. **Explora** las diferentes secciones en el menú lateral

## ⚙️ Configuración Básica

El archivo `.env` contiene la configuración:

```env
PORT=3000                    # Puerto del servidor
MAX_FILE_SIZE=5368709120     # Tamaño máximo 5GB
```

## 🔑 Funciones Principales

| Función | Descripción |
|---------|-------------|
| 📤 **Subir Archivos** | Soporta cualquier tipo de archivo |
| 📁 **Carpetas** | Organiza archivos en carpetas jerárquicas |
| 🔍 **Buscar** | Busca archivos por nombre |
| 👁️ **Vista Previa** | Ve imágenes, videos, audio y PDFs |
| 📊 **Estadísticas** | Monitorea el uso del espacio |
| 🔄 **Duplicados** | Detecta y elimina archivos duplicados |
| 👥 **Usuarios** | Gestiona usuarios (solo admin) |

## 🆘 Problemas Comunes

### El servidor no inicia en el puerto 3000
**Solución**: Cambia el puerto en `.env`
```env
PORT=8080
```

### No puedo acceder desde otro dispositivo
**Soluciones**:
1. Verifica que ambos dispositivos estén en la misma red WiFi
2. Desactiva el firewall temporalmente para probar
3. Usa la IP correcta del servidor (no 127.0.0.1)

### Error al subir archivos grandes
**Solución**: Aumenta el límite en `.env`
```env
MAX_FILE_SIZE=10737418240  # 10GB
```

## 📚 Más Información

Consulta el archivo `README.md` para:
- Documentación completa
- Configuración avanzada
- Acceso remoto seguro
- API REST

## 🎉 ¡Listo!

Tu biblioteca virtual ya está funcionando. Puedes:
- Subir archivos desde cualquier dispositivo en tu red
- Acceder a tus archivos desde el navegador
- Compartir acceso con familiares o compañeros de casa

---

**¿Necesitas ayuda?** Revisa el `README.md` completo o los logs en la carpeta `logs/`
