import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import VideoCard from "../components/VideoCard";

export default function Home() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [videos, setVideos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 12;

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (search) params.search = search;
    api.get("/videos", { params })
      .then(({ data }) => { setVideos(data.videos); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, page]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="page">
      {search && (
        <h2 style={{ marginBottom: "1.5rem", color: "var(--text-muted)", fontSize: "1rem" }}>
          Results for "<strong style={{ color: "var(--text)" }}>{search}</strong>" — {total} video{total !== 1 ? "s" : ""}
        </h2>
      )}

      {loading ? (
        <div className="spinner" />
      ) : videos.length === 0 ? (
        <div className="center" style={{ marginTop: "5rem", color: "var(--text-muted)" }}>
          <p style={{ fontSize: "3rem" }}>📭</p>
          <p style={{ marginTop: "1rem" }}>{search ? "No videos found." : "No videos uploaded yet."}</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {videos.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </button>
          <span style={{ color: "var(--text-muted)" }}>Page {page} of {totalPages}</span>
          <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1.25rem",
  },
  pagination: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "1rem", marginTop: "2.5rem",
  },
};
