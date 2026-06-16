import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { initDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";
import commentRoutes from "./routes/comments.js";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/videos/:videoId/comments", commentRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Start
const PORT = process.env.PORT || 4000;
initDB()
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch((err) => { console.error("DB init failed:", err); process.exit(1); });
