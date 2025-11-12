const bcrypt = require('bcryptjs');
const readline = require('readline');
const database = require('../models/database');
const config = require('../config/config');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function initializeDatabase() {
  try {
    console.log('\n=== Inicialización de Base de Datos - Biblioteca Virtual ===\n');

    await database.initialize();

    // Verificar si ya existe un usuario admin
    const existingAdmin = await database.get(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (existingAdmin) {
      console.log('\n⚠️  Ya existe un usuario administrador en el sistema.');
      const createAnother = await question('¿Desea crear otro usuario administrador? (s/n): ');

      if (createAnother.toLowerCase() !== 's') {
        console.log('\nInicialización cancelada.');
        rl.close();
        await database.close();
        process.exit(0);
      }
    }

    // Solicitar datos del nuevo usuario admin
    console.log('\n--- Crear Usuario Administrador ---\n');

    const username = await question('Nombre de usuario: ');

    if (!username || username.trim().length < 3) {
      console.error('\n❌ El nombre de usuario debe tener al menos 3 caracteres.');
      rl.close();
      await database.close();
      process.exit(1);
    }

    // Verificar si el usuario ya existe
    const existingUser = await database.get(
      'SELECT id FROM users WHERE username = ?',
      [username.trim()]
    );

    if (existingUser) {
      console.error('\n❌ El nombre de usuario ya existe.');
      rl.close();
      await database.close();
      process.exit(1);
    }

    const password = await question('Contraseña: ');

    if (!password || password.length < 6) {
      console.error('\n❌ La contraseña debe tener al menos 6 caracteres.');
      rl.close();
      await database.close();
      process.exit(1);
    }

    // Crear hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);

    // Insertar usuario en la base de datos
    const result = await database.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username.trim(), hashedPassword, 'admin']
    );

    console.log('\n✅ Usuario administrador creado exitosamente!');
    console.log(`   ID: ${result.lastID}`);
    console.log(`   Usuario: ${username.trim()}`);
    console.log(`   Rol: Administrador\n`);

    // Crear carpeta raíz por defecto
    await database.run(
      'INSERT INTO folders (name, parent_id, created_by) VALUES (?, ?, ?)',
      ['Raíz', null, result.lastID]
    );

    console.log('✓ Carpeta raíz creada\n');

    rl.close();
    await database.close();

    console.log('=== Inicialización completada ===\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error durante la inicialización:', error.message);
    rl.close();
    await database.close();
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
