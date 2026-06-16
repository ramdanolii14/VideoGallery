import { Router } from "express";
import { pool } from "../db.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

// GET /api/videos/:videoId/comments
router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.username, u.avatar_url
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.video_id = $1
     ORDER BY c.created_at DESC`,
    [req.params.videoId]
  );
  res.json(rows);
});

// POST /api/videos/:videoId/comments
router.post("/", authenticate, async (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: "Comment body is required." });

  const { rows } = await pool.query(
    `INSERT INTO comments (video_id, user_id, body)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [req.params.videoId, req.user.id, body.trim()]
  );

  const { rows: withUser } = await pool.query(
    `SELECT c.*, u.username, u.avatar_url FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
    [rows[0].id]
  );

  res.status(201).json(withUser[0]);
});

// DELETE /api/videos/:videoId/comments/:commentId
router.delete("/:commentId", authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM comments WHERE id = $1`,
    [req.params.commentId]
  );
  const comment = rows[0];
  if (!comment) return res.status(404).json({ error: "Comment not found." });

  const isOwner = comment.user_id === req.user.id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) return res.status(403).json({ error: "Not authorized." });

  await pool.query(`DELETE FROM comments WHERE id = $1`, [req.params.commentId]);
  res.json({ message: "Comment deleted." });
});

export default router;
