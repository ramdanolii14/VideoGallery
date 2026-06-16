import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`);
    else navigate("/");
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>▶</span> Nyantube
        </Link>

        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos..."
            style={{ ...styles.searchInput }}
          />
          <button type="submit" className="btn-primary" style={{ borderRadius: "0 8px 8px 0", padding: "0.6rem 1rem" }}>
            Search
          </button>
        </form>

        <div style={styles.actions}>
          {isAdmin && (
            <Link to="/admin/upload" style={styles.uploadBtn}>
              + Upload
            </Link>
          )}
          {user ? (
            <div style={styles.userMenu}>
              <span style={styles.username}>{user.username}</span>
              {isAdmin && <span className="badge badge-public" style={{ marginLeft: 6 }}>Admin</span>}
              <button className="btn-ghost" onClick={() => { logout(); navigate("/"); }} style={{ marginLeft: 10 }}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Link to="/login"><button className="btn-ghost">Login</button></Link>
              <Link to="/register"><button className="btn-primary">Register</button></Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: "#111",
    borderBottom: "1px solid #2e2e2e",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "0 1.5rem",
    height: 60,
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  logo: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  },
  logoIcon: { color: "#ff4444", fontSize: "1.1rem" },
  searchForm: { flex: 1, display: "flex", maxWidth: 500 },
  searchInput: {
    borderRadius: "8px 0 0 8px",
    border: "1px solid #2e2e2e",
    borderRight: "none",
    width: "100%",
    background: "#1a1a1a",
  },
  actions: { display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" },
  uploadBtn: {
    background: "#ff4444",
    color: "#fff",
    padding: "0.5rem 1rem",
    borderRadius: 8,
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  userMenu: { display: "flex", alignItems: "center" },
  username: { color: "#ccc", fontSize: "0.9rem" },
};
