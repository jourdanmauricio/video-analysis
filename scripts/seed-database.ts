import { createUser, getUserByEmail } from "../lib/auth-utils";

interface SeedUser {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
}

async function seedDatabase() {
  console.log("🌱 Iniciando seeding de la base de datos...");

  // Verificar que las variables de entorno estén configuradas
  const requiredEnvVars = [
    "ADMIN_NAME",
    "ADMIN_LASTNAME",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error(
      "❌ Error: Variables de entorno requeridas no configuradas en .env.local:"
    );
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error(
      "\n💡 Crea un archivo .env.local con estas variables antes de instalar."
    );
    process.exit(1);
  }

  // Usuario admin desde variables de entorno
  const adminUser: SeedUser = {
    name: process.env.ADMIN_NAME!,
    lastname: process.env.ADMIN_LASTNAME!,
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
    role: "admin",
  };

  const usersToCreate = [adminUser];

  console.log(`👥 Usuarios a crear: ${usersToCreate.length}`);

  for (const userData of usersToCreate) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = getUserByEmail(userData.email);

      if (existingUser) {
        console.log(`⚠️  Usuario ${userData.email} ya existe, saltando...`);
        continue;
      }

      // Crear usuario
      const user = await createUser(userData);

      console.log(`✅ Usuario creado exitosamente:`, {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      });

      console.log(`\n📋 Credenciales de acceso:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${userData.password}`);
      console.log(`   Rol: ${user.role}`);
    } catch (error) {
      console.error(`❌ Error creando usuario ${userData.email}:`, error);
    }
  }

  console.log("🎉 Seeding completado!");
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Error en seeding:", error);
      process.exit(1);
    });
}

export default seedDatabase;
