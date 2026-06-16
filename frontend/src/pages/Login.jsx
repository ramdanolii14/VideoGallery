import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Welcome back</h1>
        <p style={styles.sub}>Sign in to your account</p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={styles.label}>Email</label>
            <input
              type="email" value={form.email} autoComplete="email" required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label style={styles.label}>Password</label>
            <input
              type="password" value={form.password} autoComplete="current-password" required
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p style={{ marginTop: "1.2rem", color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center" }}>
          No account? <Link to="/register" style={{ color: "var(--accent)" }}>Register</Link>
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
