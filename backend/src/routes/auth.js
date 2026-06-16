import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "All fields are required." });

  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'user') RETURNING id, username, email, role, created_at`,
      [username, email, hash]
    );
    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Username or email already taken." });
    }
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required." });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials." });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;
