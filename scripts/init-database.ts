import { config } from "dotenv";
import { prisma } from "../lib/prisma";
import seedDatabase from "./seed-database";
import fs from "fs";
import path from "path";

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
      await seedDatabase();
    } else {
      console.log(`📊 Base de datos ya tiene ${userCount} usuarios`);
    }

    console.log("✅ Base de datos inicializada correctamente");
  } catch (error) {
    console.error("❌ Error inicializando base de datos:", error);
    throw error;
  } finally {
    // Cerrar la conexión de Prisma
    await prisma.$disconnect();
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

export default initializeDatabase;
