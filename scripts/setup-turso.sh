#!/bin/bash

# Script para configurar Turso con las tablas y usuario admin
# Uso: ./scripts/setup-turso.sh

set -e

echo "🚀 Configurando base de datos Turso..."

# Cargar variables de entorno desde .env.local
if [ -f ".env.local" ]; then
    echo "📄 Cargando variables de entorno desde .env.local..."
    export $(grep -v '^#' .env.local | xargs)
fi

# Verificar que las variables de entorno estén configuradas
if [ -z "$TURSO_DATABASE_URL" ]; then
    echo "❌ Error: TURSO_DATABASE_URL no está configurada"
    echo "   Configura la variable en .env.local:"
    echo "   TURSO_DATABASE_URL=\"libsql://tu-database.turso.io\""
    exit 1
fi

# Verificar variables de usuario admin
if [ -z "$ADMIN_NAME" ] || [ -z "$ADMIN_LASTNAME" ] || [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ Error: Variables de usuario admin no configuradas"
    echo "   Configura estas variables en .env.local:"
    echo "   ADMIN_NAME=\"Admin\""
    echo "   ADMIN_LASTNAME=\"User\""
    echo "   ADMIN_EMAIL=\"admin@example.com\""
    echo "   ADMIN_PASSWORD=\"admin123\""
    exit 1
fi

echo "✅ Usando base de datos: $TURSO_DATABASE_URL"

echo "📊 Creando tabla users..."

# Crear tabla users
turso db shell $TURSO_DATABASE_URL << 'EOF'
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
EOF

echo "✅ Tabla users creada exitosamente"

echo "📊 Creando tabla jobs..."

# Crear tabla jobs
turso db shell $TURSO_DATABASE_URL << 'EOF'
CREATE TABLE IF NOT EXISTS jobs (
    job_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    step TEXT NOT NULL,
    progress INTEGER NOT NULL,
    message TEXT NOT NULL,
    result_transcription TEXT,
    result_gpt_response TEXT,
    error TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
EOF

echo "✅ Tabla jobs creada exitosamente"

echo "👤 Creando usuario admin..."

# Generar hash de la contraseña usando Node.js
HASHED_PASSWORD=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('$ADMIN_PASSWORD', 12));")

# Crear usuario admin usando variables de entorno
turso db shell $TURSO_DATABASE_URL << EOF
INSERT OR IGNORE INTO users (name, lastname, email, password, role) 
VALUES (
    '$ADMIN_NAME', 
    '$ADMIN_LASTNAME', 
    '$ADMIN_EMAIL', 
    '$HASHED_PASSWORD', 
    'admin'
);
EOF

echo "✅ Usuario admin creado exitosamente"
echo ""
echo "📋 Credenciales de acceso:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $ADMIN_PASSWORD"
echo "   Rol: admin"
echo ""
echo "🔧 Configura estas variables de entorno:"
echo "   export DATABASE_URL=\"$TURSO_DATABASE_URL\""
echo "   export AUTH_URL=\"http://localhost:3000\""
echo "   export NEXTAUTH_URL=\"http://localhost:3000\""
echo "   export AUTH_SECRET=\"tu-secret-key-muy-largo-y-seguro\""
echo ""
echo "🎉 Base de datos Turso configurada correctamente!"
