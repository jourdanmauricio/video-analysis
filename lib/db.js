const { prisma } = require("./prisma.js");

// Exportar Prisma client para uso en la aplicación
module.exports = prisma;

// Funciones de utilidad para usuarios
const userQueries = {
  // Crear usuario
  async create(data) {
    return await prisma.user.create({
      data: {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
        password: data.password,
        role: data.role || "user",
      },
    });
  },

  // Buscar usuario por email
  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  // Buscar usuario por ID
  async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  // Actualizar usuario
  async update(id, data) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  },

  // Eliminar usuario
  async delete(id) {
    return await prisma.user.delete({
      where: { id },
    });
  },

  // Listar todos los usuarios
  async findAll() {
    return await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  },
};

module.exports.userQueries = userQueries;
