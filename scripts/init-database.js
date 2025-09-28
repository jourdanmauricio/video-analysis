const { config } = require("dotenv");
const { prisma } = require("../lib/prisma");
const seedDatabase = require("./seed-database");
const fs = require("fs");
const path = require("path");

// Cargar variables de entorno
config({ path: ".env.local" });

async function initializeDatabase() {
  console.log("=".repeat(50));
  console.log("🚀 INICIANDO INICIALIZACIÓN DE BASE DE DATOS");
  console.log("=".repeat(50));

  try {
    // Asegurar que el directorio data existe
    const dataDir = path.join(process.cwd(), "data");
    console.log(`📁 Verificando directorio data: ${dataDir}`);
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log("✅ Directorio data creado exitosamente");
    } else {
      console.log("✅ Directorio data ya existe");
    }

    // Verificar si la base de datos ya tiene usuarios usando Prisma
    console.log("🔍 Conectando a la base de datos...");
    const userCount = await prisma.user.count();
    console.log(`📊 Usuarios encontrados en la base de datos: ${userCount}`);

    if (userCount === 0) {
      console.log("📝 Base de datos vacía, ejecutando seeding...");
      try {
        await seedDatabase();
        console.log("✅ Seeding completado exitosamente");
      } catch (seedError) {
        console.warn("⚠️  Warning: Seeding falló, pero continuando:", seedError.message);
        console.warn("⚠️  Detalles del error:", seedError);
      }
    } else {
      console.log(`✅ Base de datos ya tiene ${userCount} usuarios, no se necesita seeding`);
    }

    console.log("=".repeat(50));
    console.log("✅ BASE DE DATOS INICIALIZADA CORRECTAMENTE");
    console.log("=".repeat(50));
  } catch (error) {
    console.error("=".repeat(50));
    console.error("❌ ERROR INICIALIZANDO BASE DE DATOS");
    console.error("=".repeat(50));
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    console.log("⚠️  Continuando sin inicialización de base de datos...");
  } finally {
    // Cerrar la conexión de Prisma
    try {
      console.log("🔌 Cerrando conexión de Prisma...");
      await prisma.$disconnect();
      console.log("✅ Conexión de Prisma cerrada");
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
