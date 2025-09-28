# 📁 Carpeta de Datos

Esta carpeta contiene los archivos de datos de la aplicación.

## Archivos

- `database.sqlite` - Base de datos SQLite de la aplicación

## Notas

- Esta carpeta se crea automáticamente cuando se ejecuta la aplicación
- El archivo `database.sqlite` se ignora en git (no se sube al repositorio)
- En producción, asegúrate de que esta carpeta tenga permisos de escritura
- Para respaldos, incluye esta carpeta completa

## Estructura de la Base de Datos

La base de datos contiene las siguientes tablas:

- `users` - Usuarios del sistema
  - `id` - ID único del usuario
  - `name` - Nombre del usuario
  - `lastname` - Apellido del usuario
  - `email` - Email del usuario (único)
  - `password` - Contraseña hasheada
  - `role` - Rol del usuario (admin, user)
  - `created_at` - Fecha de creación
