import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(__dirname, "../../uploads");

function storage(subdir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(BASE, subdir);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

export const videoUpload = multer({
  storage: storage("videos"),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
  fileFilter: (req, file, cb) => {
    const allowed = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
    cb(null, allowed.includes(file.mimetype));
  },
});

export const thumbUpload = multer({
  storage: storage("thumbnails"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith("image/"));
  },
});
