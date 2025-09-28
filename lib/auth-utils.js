const bcrypt = require("bcryptjs");
const { userQueries } = require("./db.js");

async function createUser(userData) {
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

async function getUserByEmail(email) {
  return await userQueries.findByEmail(email);
}

async function getUserById(id) {
  return await userQueries.findById(id);
}

async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  verifyPassword,
};
