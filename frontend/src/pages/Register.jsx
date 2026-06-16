import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Create account</h1>
        <p style={styles.sub}>Join to comment and interact with videos</p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { key: "username", label: "Username", type: "text", auto: "username" },
            { key: "email", label: "Email", type: "email", auto: "email" },
            { key: "password", label: "Password", type: "password", auto: "new-password" },
          ].map(({ key, label, type, auto }) => (
            <div key={key}>
              <label style={styles.label}>{label}</label>
              <input
                type={type} value={form[key]} autoComplete={auto} required
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          {error && <p className="error-msg">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p style={{ marginTop: "1.2rem", color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "1rem" },
  card: { background: "var(--surface)", borderRadius: 12, padding: "2rem", width: "100%", maxWidth: 420 },
  heading: { fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 },
  sub: { color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" },
  label: { display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 4 },
};
