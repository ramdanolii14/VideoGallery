import { Router } from "express";
import { pool } from "../db.js";
import { authenticate, requireAdmin, optionalAuth } from "../middleware/auth.js";
import { videoUpload, thumbUpload } from "../middleware/upload.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_BASE = path.join(__dirname, "../../uploads");

// GET /api/videos — list all public videos (+ unlisted if admin)
router.get("/", optionalAuth, async (req, res) => {
  const { search, page = 1, limit = 12 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const isAdmin = req.user?.role === "admin";

  let where = isAdmin ? `WHERE v.visibility IN ('public','unlisted','private')` : `WHERE v.visibility = 'public'`;
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    where += ` AND (v.title ILIKE $${params.length} OR v.description ILIKE $${params.length})`;
  }

  params.push(Number(limit), offset);

  const { rows } = await pool.query(
    `SELECT v.*, u.username AS uploader_username,
            (SELECT COUNT(*) FROM likes WHERE video_id = v.id) AS like_count
     FROM videos v
     JOIN users u ON u.id = v.uploader_id
     ${where}
     ORDER BY v.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countParams = search ? [`%${search}%`] : [];
  const whereCount = isAdmin
    ? (search ? `WHERE (v.title ILIKE $1 OR v.description ILIKE $1)` : "")
    : search
    ? `WHERE v.visibility = 'public' AND (v.title ILIKE $1 OR v.description ILIKE $1)`
    : `WHERE v.visibility = 'public'`;

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM videos v ${whereCount}`,
    countParams
  );

  res.json({ videos: rows, total: Number(countRows[0].count), page: Number(page), limit: Number(limit) });
});

// GET /api/videos/:id
router.get("/:id", optionalAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT v.*, u.username AS uploader_username,
            (SELECT COUNT(*) FROM likes WHERE video_id = v.id) AS like_count
     FROM videos v
     JOIN users u ON u.id = v.uploader_id
     WHERE v.id = $1`,
    [req.params.id]
  );

  const video = rows[0];
  if (!video) return res.status(404).json({ error: "Video not found." });

  const isAdmin = req.user?.role === "admin";
  if (video.visibility === "private" && !isAdmin) {
    return res.status(403).json({ error: "This video is private." });
  }

  // Increment view count
  await pool.query(`UPDATE videos SET view_count = view_count + 1 WHERE id = $1`, [video.id]);
  video.view_count += 1;

  res.json(video);
});

// POST /api/videos — admin upload video
router.post(
  "/",
  authenticate,
  requireAdmin,
  videoUpload.single("video"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No video file provided." });

    const { title, description, visibility = "public", duration } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required." });

    const { rows } = await pool.query(
      `INSERT INTO videos (title, description, filename, visibility, duration, uploader_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description || null, req.file.filename, visibility, duration ? Number(duration) : null, req.user.id]
    );

    res.status(201).json(rows[0]);
  }
);

// PATCH /api/videos/:id/thumbnail — upload thumbnail separately
router.patch(
  "/:id/thumbnail",
  authenticate,
  requireAdmin,
  thumbUpload.single("thumbnail"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image file." });

    const { rows } = await pool.query(
      `UPDATE videos SET thumbnail = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [req.file.filename, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Video not found." });
    res.json(rows[0]);
  }
);

// PATCH /api/videos/:id — update metadata / visibility
router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  const { title, description, visibility } = req.body;
  const allowed = ["public", "unlisted", "private"];

  if (visibility && !allowed.includes(visibility)) {
    return res.status(400).json({ error: "Invalid visibility value." });
  }

  const { rows } = await pool.query(
    `UPDATE videos
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         visibility = COALESCE($3, visibility),
         updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [title || null, description !== undefined ? description : null, visibility || null, req.params.id]
  );

  if (!rows[0]) return res.status(404).json({ error: "Video not found." });
  res.json(rows[0]);
});

// DELETE /api/videos/:id
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  const { rows } = await pool.query(`DELETE FROM videos WHERE id = $1 RETURNING *`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Video not found." });

  // Remove files from disk
  const videoPath = path.join(UPLOAD_BASE, "videos", rows[0].filename);
  const thumbPath = rows[0].thumbnail ? path.join(UPLOAD_BASE, "thumbnails", rows[0].thumbnail) : null;
  [videoPath, thumbPath].forEach((p) => { if (p && fs.existsSync(p)) fs.unlinkSync(p); });

  res.json({ message: "Video deleted." });
});

// POST /api/videos/:id/like
router.post("/:id/like", authenticate, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO likes (video_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.params.id, req.user.id]
    );
    const { rows } = await pool.query(`SELECT COUNT(*) FROM likes WHERE video_id = $1`, [req.params.id]);
    res.json({ like_count: Number(rows[0].count) });
  } catch {
    res.status(500).json({ error: "Server error." });
  }
});

// DELETE /api/videos/:id/like
router.delete("/:id/like", authenticate, async (req, res) => {
  await pool.query(`DELETE FROM likes WHERE video_id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
  const { rows } = await pool.query(`SELECT COUNT(*) FROM likes WHERE video_id = $1`, [req.params.id]);
  res.json({ like_count: Number(rows[0].count) });
});

// GET /api/videos/:id/liked — check if current user liked
router.get("/:id/liked", authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT 1 FROM likes WHERE video_id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );
  res.json({ liked: rows.length > 0 });
});

export default router;
