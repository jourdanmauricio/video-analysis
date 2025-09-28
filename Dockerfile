# Dockerfile
FROM node:22-alpine

# Instalar FFmpeg y dependencias necesarias
RUN apk add --no-cache \
    ffmpeg \
    sqlite \
    python3 \
    make \
    g++ \
    libc6-compat

# Crear directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias con soporte para SQLite nativo
RUN npm ci && npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# Copiar código fuente
COPY . .

# Crear directorios necesarios con permisos correctos
RUN mkdir -p uploads temp data logs && \
    chown -R node:node /app

# Cambiar a usuario no-root por seguridad
USER node

# Generar cliente de Prisma y build de Next.js 15
RUN npx prisma generate && npm run build

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/uploads
ENV TEMP_DIR=/app/temp
ENV DATABASE_PATH=/app/data/jobs.db

# Comando de inicio con inicialización de base de datos
CMD ["sh", "-c", "node scripts/init-database.js && npm start"]