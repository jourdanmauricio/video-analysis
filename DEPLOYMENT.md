# 🚀 Guía de Despliegue

## Desarrollo Local

### 1. Configuración inicial

```bash
# Instalar dependencias
npm install

# La base de datos se inicializa automáticamente con usuarios de prueba
# Usuarios por defecto:
# - admin@example.com / admin123 (admin)
# - test@example.com / test123 (user)
```

### 2. Ejecutar en desarrollo

```bash
npm run dev
```

## Producción

### 1. Configurar variables de entorno

```bash
# En tu servidor VPS, crear archivo .env.local
export NODE_ENV=production
export NEXTAUTH_URL=https://tudominio.com
export NEXTAUTH_SECRET=tu-secret-key-muy-seguro
export ADMIN_EMAIL=admin@tudominio.com
export ADMIN_PASSWORD=tu-password-super-seguro
export ADMIN_NAME=Admin
export ADMIN_LASTNAME=User
```

### 2. Despliegue automático

```bash
# Ejecutar script de despliegue
./scripts/deploy.sh
```

### 3. Despliegue manual

```bash
# Instalar dependencias
npm ci --only=production

# Construir aplicación
npm run build

# Inicializar base de datos con usuarios de producción
NODE_ENV=production npm run init-db

# Iniciar aplicación
npm start
```

## Scripts Disponibles

- `npm run dev` - Desarrollo local
- `npm run build` - Construir para producción
- `npm run start` - Iniciar en producción
- `npm run seed` - Crear usuarios de prueba
- `npm run init-db` - Inicializar base de datos
- `npm run create-user` - Crear usuario individual (usa variables de entorno)
- `npm run create-user -- --help` - Ver ayuda del script

## Crear Usuarios Individuales

### Uso básico

```bash
# Crear usuario con todas las variables
USER_NAME=Juan USER_LASTNAME=Pérez USER_EMAIL=test@example.com USER_PASSWORD=test123 USER_ROLE=user npm run create-user

# Crear usuario admin para producción
USER_NAME=Admin USER_LASTNAME=User USER_EMAIL=admin@tudominio.com USER_PASSWORD=secure123 USER_ROLE=admin npm run create-user

# Usar archivo .env (recomendado)
# Crear archivo .env con las variables y ejecutar:
npm run create-user
```

### Variables de entorno requeridas

- `USER_NAME` - Nombre del usuario (obligatorio)
- `USER_LASTNAME` - Apellido del usuario (obligatorio)
- `USER_EMAIL` - Email del usuario (obligatorio)
- `USER_PASSWORD` - Contraseña del usuario (obligatorio)
- `USER_ROLE` - Rol del usuario (obligatorio)

### Ver ayuda

```bash
npm run create-user -- --help
```

## Estructura de Usuarios

### Desarrollo

- **admin@example.com** / admin123 (rol: admin)
- **test@example.com** / test123 (rol: user)

### Producción

- Usuario admin configurado via variables de entorno
- Email: `$ADMIN_EMAIL`
- Password: `$ADMIN_PASSWORD`
- Nombre: `$ADMIN_NAME $ADMIN_LASTNAME`

## Seguridad

⚠️ **Importante para producción:**

1. Cambiar todas las contraseñas por defecto
2. Usar contraseñas seguras y únicas
3. Configurar HTTPS
4. Mantener las variables de entorno seguras
5. No commitear archivos .env a git

## Troubleshooting

### Error: "Usuario no encontrado"

- Verificar que la base de datos esté inicializada
- Ejecutar `npm run init-db`

### Error: "Base de datos no encontrada"

- Verificar permisos de escritura en el directorio
- Ejecutar `npm run seed` para crear usuarios de prueba
