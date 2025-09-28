# Dockerfile
FROM node:22-alpine

# Instalar FFmpeg y dependencias necesarias
RUN apk add --no-cache \
    ffmpeg \
    sqlite \
    python3 \
    make \
    g++ \
    libc6-compat \
    curl

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

# Build de Next.js 15
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/uploads
ENV TEMP_DIR=/app/temp

# Comando de inicio
CMD ["npm", "start"]