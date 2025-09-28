import bcrypt from "bcryptjs";
import db from "./db";

export interface User {
  id: number;
  name: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
  created_at: string;
}

export async function createUser(userData: {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role?: string;
}): Promise<User> {
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  const stmt = db.prepare(`
    INSERT INTO users (name, lastname, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    userData.name,
    userData.lastname,
    userData.email,
    hashedPassword,
    userData.role || "user"
  );

  const user = getUserById(result.lastInsertRowid as number);
  if (!user) {
    throw new Error("Error al crear el usuario");
  }
  return user;
}

export function getUserByEmail(email: string): User | null {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return stmt.get(email) as User | null;
}

export function getUserById(id: number): User | null {
  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  return stmt.get(id) as User | null;
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
