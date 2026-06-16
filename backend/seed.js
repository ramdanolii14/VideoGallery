import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { pool, initDB } from "./src/db.js";

dotenv.config();

async function seed() {
  await initDB();

  const username = process.env.ADMIN_USERNAME || "admin";
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = $3`,
    [username, email, hash]
  );

  console.log(`Admin user created: ${email} / ${password}`);
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
