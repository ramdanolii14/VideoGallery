import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS videos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      filename TEXT NOT NULL,
      thumbnail TEXT,
      duration INTEGER,
      visibility VARCHAR(20) NOT NULL DEFAULT 'public',
      view_count INTEGER NOT NULL DEFAULT 0,
      uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS likes (
      video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (video_id, user_id)
    );
  `);
  console.log("Database schema ready.");
}
