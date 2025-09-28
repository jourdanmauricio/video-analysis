import { prisma } from "./prisma";

// Exportar Prisma client para uso en la aplicación
export default prisma;

// Funciones de utilidad para usuarios
export const userQueries = {
  // Crear usuario
  async create(data: {
    name: string;
    lastname: string;
    email: string;
    password: string;
    role?: string;
  }) {
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
  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  // Buscar usuario por ID
  async findById(id: number) {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  // Actualizar usuario
  async update(
    id: number,
    data: Partial<{
      name: string;
      lastname: string;
      email: string;
      password: string;
      role: string;
    }>
  ) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  },

  // Eliminar usuario
  async delete(id: number) {
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
