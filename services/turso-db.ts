import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export interface User {
  id: number;
  name: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
  created_at: Date;
}

// Funciones de utilidad para usuarios
export const userQueries = {
  // Crear usuario
  async create(data: {
    name: string;
    lastname: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<User> {
    const result = await client.execute({
      sql: `
        INSERT INTO users (name, lastname, email, password, role)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [
        data.name,
        data.lastname,
        data.email,
        data.password,
        data.role || "user",
      ],
    });

    const newUser = await this.findById(Number(result.lastInsertRowid));
    if (!newUser) {
      throw new Error("Failed to create user");
    }

    return newUser;
  },

  // Buscar usuario por email
  async findByEmail(email: string): Promise<User | null> {
    const result = await client.execute({
      sql: `SELECT * FROM users WHERE email = ?`,
      args: [email],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as number,
      name: row.name as string,
      lastname: row.lastname as string,
      email: row.email as string,
      password: row.password as string,
      role: row.role as string,
      created_at: new Date(row.created_at as string),
    };
  },

  // Buscar usuario por ID
  async findById(id: number): Promise<User | null> {
    const result = await client.execute({
      sql: `SELECT * FROM users WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as number,
      name: row.name as string,
      lastname: row.lastname as string,
      email: row.email as string,
      password: row.password as string,
      role: row.role as string,
      created_at: new Date(row.created_at as string),
    };
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
  ): Promise<User> {
    const fields = [];
    const values = [];

    if (data.name) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.lastname) {
      fields.push("lastname = ?");
      values.push(data.lastname);
    }
    if (data.email) {
      fields.push("email = ?");
      values.push(data.email);
    }
    if (data.password) {
      fields.push("password = ?");
      values.push(data.password);
    }
    if (data.role) {
      fields.push("role = ?");
      values.push(data.role);
    }

    values.push(id);

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

    await client.execute({
      sql: query,
      args: values,
    });

    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error("Failed to update user");
    }

    return updatedUser;
  },

  // Eliminar usuario
  async delete(id: number): Promise<void> {
    await client.execute({
      sql: `DELETE FROM users WHERE id = ?`,
      args: [id],
    });
  },

  // Listar todos los usuarios
  async findAll(): Promise<User[]> {
    const result = await client.execute({
      sql: `SELECT * FROM users ORDER BY created_at DESC`,
    });

    return result.rows.map((row) => ({
      id: row.id as number,
      name: row.name as string,
      lastname: row.lastname as string,
      email: row.email as string,
      password: row.password as string,
      role: row.role as string,
      created_at: new Date(row.created_at as string),
    }));
  },

  // Contar usuarios
  async count(): Promise<number> {
    const result = await client.execute({
      sql: `SELECT COUNT(*) as count FROM users`,
    });

    return result.rows[0].count as number;
  },
};

// Exportar el cliente para compatibilidad
export default client;
