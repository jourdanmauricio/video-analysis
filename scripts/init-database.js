const { config } = require("dotenv");
const { prisma } = require("../lib/prisma");
const seedDatabase = require("./seed-database");
const fs = require("fs");
const path = require("path");

// Cargar variables de entorno
config({ path: ".env.local" });

async function initializeDatabase() {
  console.log("🚀 Inicializando base de datos...");

  try {
    // Asegurar que el directorio data existe
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log("📁 Directorio data creado");
    }

    // Verificar si la base de datos ya tiene usuarios usando Prisma
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      console.log("📝 Base de datos vacía, ejecutando seeding...");
      try {
        await seedDatabase();
      } catch (seedError) {
        console.warn("⚠️  Warning: Seeding falló, pero continuando:", seedError.message);
      }
    } else {
      console.log(`📊 Base de datos ya tiene ${userCount} usuarios`);
    }

    console.log("✅ Base de datos inicializada correctamente");
  } catch (error) {
    console.error("❌ Error inicializando base de datos:", error);
    // No lanzar el error, solo loggearlo
    console.log("⚠️  Continuando sin inicialización de base de datos...");
  } finally {
    // Cerrar la conexión de Prisma
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.warn("⚠️  Warning: Error cerrando conexión Prisma:", disconnectError.message);
    }
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error en inicialización:", error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;
