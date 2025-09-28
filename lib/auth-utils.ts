import bcrypt from "bcryptjs";
import { userQueries } from "./db";

export interface User {
  id: number;
  name: string;
  lastname: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
}

export async function createUser(userData: {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role?: string;
}): Promise<User> {
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  const user = await userQueries.create({
    name: userData.name,
    lastname: userData.lastname,
    email: userData.email,
    password: hashedPassword,
    role: userData.role || "user",
  });

  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return await userQueries.findByEmail(email);
}

export async function getUserById(id: number): Promise<User | null> {
  return await userQueries.findById(id);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
