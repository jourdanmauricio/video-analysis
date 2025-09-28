import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

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

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM users WHERE email = ?",
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
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
