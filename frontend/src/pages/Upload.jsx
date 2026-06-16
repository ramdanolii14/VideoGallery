import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Upload() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", visibility: "public" });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  if (!isAdmin) return (
    <div className="page center" style={{ marginTop: "4rem" }}>
      <p style={{ color: "#f87171" }}>Access denied. Admins only.</p>
    </div>
  );

  async function submit(e) {
    e.preventDefault();
    if (!videoFile) return setError("Please select a video file.");
    setError("");
    setUploading(true);
    setProgress(0);

    const fd = new FormData();
    fd.append("video", videoFile);
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("visibility", form.visibility);

    try {
      const { data: video } = await api.post("/videos", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      // Upload thumbnail if provided
      if (thumbFile) {
        const tfd = new FormData();
        tfd.append("thumbnail", thumbFile);
        await api.patch(`/videos/${video.id}/thumbnail`, tfd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      navigate(`/watch/${video.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed.");
      setUploading(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <h1 style={{ marginBottom: "1.5rem", fontSize: "1.4rem" }}>Upload Video</h1>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <Field label="Title *">
          <input
            required value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={4} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description..."
            style={{ resize: "vertical" }}
          />
        </Field>

        <Field label="Visibility">
          <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
            <option value="public">Public — visible to everyone</option>
            <option value="unlisted">Unlisted — only via direct link</option>
            <option value="private">Private — admin only</option>
          </select>
        </Field>

        <Field label="Video File *" hint="MP4, WebM, OGG, MOV, AVI — up to 2 GB">
          <input
            type="file" accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0] || null)}
            required
          />
        </Field>

        <Field label="Thumbnail (optional)" hint="JPG, PNG, GIF — up to 10 MB">
          <input
            type="file" accept="image/*"
            onChange={(e) => setThumbFile(e.target.files[0] || null)}
          />
        </Field>

        {uploading && (
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
            <span style={styles.progressLabel}>{progress}%</span>
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}

        <button className="btn-primary" type="submit" disabled={uploading} style={{ padding: "0.75rem" }}>
          {uploading ? `Uploading... ${progress}%` : "Upload Video"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {hint && <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: 6 }}>{hint}</p>}
      {children}
    </div>
  );
}

const styles = {
  progressWrap: {
    background: "var(--surface2)",
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
    position: "relative",
  },
  progressBar: {
    height: "100%",
    background: "var(--accent)",
    transition: "width 0.2s",
    borderRadius: 999,
  },
  progressLabel: {
    position: "absolute",
    right: 8, top: -2,
    fontSize: "0.7rem",
    color: "var(--text-muted)",
  },
};
