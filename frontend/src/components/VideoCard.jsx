import { Link } from "react-router-dom";

function formatDuration(secs) {
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

export default function VideoCard({ video }) {
  const thumb = video.thumbnail
    ? `/uploads/thumbnails/${video.thumbnail}`
    : null;

  return (
    <Link to={`/watch/${video.id}`} style={styles.card}>
      <div style={styles.thumbWrap}>
        {thumb ? (
          <img src={thumb} alt={video.title} style={styles.thumb} />
        ) : (
          <div style={styles.thumbPlaceholder}>▶</div>
        )}
        {video.duration && (
          <span style={styles.duration}>{formatDuration(video.duration)}</span>
        )}
        {video.visibility !== "public" && (
          <span className={`badge badge-${video.visibility}`} style={styles.visBadge}>
            {video.visibility}
          </span>
        )}
      </div>
      <div style={styles.info}>
        <p style={styles.title}>{video.title}</p>
        <p style={styles.meta}>
          {formatViews(video.view_count)} · {timeAgo(video.created_at)}
        </p>
        <p style={styles.uploader}>{video.uploader_username}</p>
      </div>
    </Link>
  );
}

const styles = {
  card: {
    display: "block",
    background: "var(--surface)",
    borderRadius: 10,
    overflow: "hidden",
    transition: "transform 0.15s",
    cursor: "pointer",
  },
  thumbWrap: {
    position: "relative",
    aspectRatio: "16/9",
    background: "#000",
    overflow: "hidden",
  },
  thumb: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  thumbPlaceholder: {
    width: "100%", height: "100%", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontSize: "2.5rem", color: "#333",
  },
  duration: {
    position: "absolute", bottom: 6, right: 8,
    background: "rgba(0,0,0,0.8)", color: "#fff",
    fontSize: "0.75rem", borderRadius: 4, padding: "1px 5px",
  },
  visBadge: { position: "absolute", top: 6, left: 8 },
  info: { padding: "0.75rem" },
  title: { fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.3, marginBottom: 4 },
  meta: { color: "var(--text-muted)", fontSize: "0.8rem" },
  uploader: { color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 2 },
};
