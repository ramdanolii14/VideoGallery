import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function EditVideo() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", visibility: "public" });
  const [thumbFile, setThumbFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get(`/videos/${id}`).then(({ data }) => {
      setForm({ title: data.title, description: data.description || "", visibility: data.visibility });
    });
  }, [id]);

  if (!isAdmin) return <div className="page center"><p style={{ color: "#f87171", marginTop: "4rem" }}>Access denied.</p></div>;

  async function submit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    setSaving(true);
    try {
      await api.patch(`/videos/${id}`, form);
      if (thumbFile) {
        const fd = new FormData();
        fd.append("thumbnail", thumbFile);
        await api.patch(`/videos/${id}/thumbnail`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setSuccess("Changes saved.");
      setTimeout(() => navigate(`/watch/${id}`), 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <h1 style={{ marginBottom: "1.5rem", fontSize: "1.4rem" }}>Edit Video</h1>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <div>
          <label style={lbl}>Title *</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label style={lbl}>Description</label>
          <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical" }} />
        </div>
        <div>
          <label style={lbl}>Visibility</label>
          <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Replace Thumbnail (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files[0] || null)} />
        </div>
        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button type="button" className="btn-ghost" onClick={() => navigate(`/watch/${id}`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const lbl = { display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: 6 };
