import { createUser, getUserByEmail } from "../lib/auth-utils";

interface UserData {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
}

async function createUserFromEnv() {
  // Validar que todas las variables de entorno estén configuradas
  const requiredEnvVars = [
    "USER_NAME",
    "USER_LASTNAME",
    "USER_EMAIL",
    "USER_PASSWORD",
    "USER_ROLE",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error("❌ Error: Variables de entorno requeridas no configuradas:");
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error(
      "\n💡 Configura las variables de entorno antes de ejecutar el script."
    );
    console.error(
      "   Ejemplo: USER_EMAIL=test@example.com USER_PASSWORD=test123 npm run create-user"
    );
    process.exit(1);
  }

  // Obtener datos desde variables de entorno
  const userData: UserData = {
    name: process.env.USER_NAME!,
    lastname: process.env.USER_LASTNAME!,
    email: process.env.USER_EMAIL!,
    password: process.env.USER_PASSWORD!,
    role: process.env.USER_ROLE!,
  };

  try {
    // Verificar si el usuario ya existe
    const existingUser = getUserByEmail(userData.email);
    if (existingUser) {
      console.log(
        `⚠️  Usuario ${userData.email} ya existe, saltando creación...`
      );
      return;
    }

    // Crear usuario
    const user = await createUser(userData);

    console.log("✅ Usuario creado exitosamente:", {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    });

    console.log("\n📋 Credenciales de acceso:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   Rol: ${user.role}`);
  } catch (error) {
    console.error("❌ Error creando usuario:", error);
    process.exit(1);
  }
}

// Mostrar ayuda si se solicita
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
🔧 Script de creación de usuario

Variables de entorno requeridas:
  USER_NAME        - Nombre del usuario (obligatorio)
  USER_LASTNAME    - Apellido del usuario (obligatorio)
  USER_EMAIL       - Email del usuario (obligatorio)
  USER_PASSWORD    - Contraseña del usuario (obligatorio)
  USER_ROLE        - Rol del usuario (obligatorio)

Ejemplos de uso:
  # Crear usuario básico
  USER_NAME=Juan USER_LASTNAME=Pérez USER_EMAIL=test@example.com USER_PASSWORD=test123 USER_ROLE=user npm run create-user

  # Crear usuario admin para producción
  USER_NAME=Admin USER_LASTNAME=User USER_EMAIL=admin@tudominio.com USER_PASSWORD=secure123 USER_ROLE=admin npm run create-user

  # Usar archivo .env
  # Crear archivo .env con las variables y ejecutar:
  # npm run create-user
`);
  process.exit(0);
}

createUserFromEnv();
