import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function timeAgo(d) {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
}

function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Custom Video Player ──────────────────────────────────────────────────────
function VideoPlayer({ src, poster }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const volumeRef = useRef(null);
  const hideTimer = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [seeking, setSeeking] = useState(false);

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  const revealControls = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    scheduleHide();
    return () => clearTimeout(hideTimer.current);
  }, [playing, scheduleHide]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
      if (e.key === "m") toggleMute();
      if (e.key === "f") toggleFullscreen();
      if (e.key === "ArrowRight") { if (videoRef.current) videoRef.current.currentTime += 5; }
      if (e.key === "ArrowLeft") { if (videoRef.current) videoRef.current.currentTime -= 5; }
      if (e.key === "ArrowUp") { e.preventDefault(); setVolume(v => Math.min(1, v + 0.1)); }
      if (e.key === "ArrowDown") { e.preventDefault(); setVolume(v => Math.max(0, v - 0.1)); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
    revealControls();
  }

  function toggleMute() {
    setMuted(m => {
      if (videoRef.current) videoRef.current.muted = !m;
      return !m;
    });
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v || seeking) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }
  }

  function onProgressClick(e) {
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const v = videoRef.current;
    if (v) v.currentTime = ratio * v.duration;
  }

  function onVolumeClick(e) {
    const rect = volumeRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setVolume(Math.max(0, Math.min(1, ratio)));
    setMuted(false);
    if (videoRef.current) videoRef.current.muted = false;
  }

  function setSpeed(rate) {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setShowSpeedMenu(false);
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;
  const volPct = muted ? 0 : volume * 100;

  const volumeIcon = muted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊";

  return (
    <div
      ref={containerRef}
      style={{ ...p.wrap, cursor: showControls ? "default" : "none" }}
      onMouseMove={revealControls}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={(e) => { if (e.target === containerRef.current || e.target === videoRef.current) togglePlay(); }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        style={p.video}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onWaiting={() => setWaiting(true)}
        onCanPlay={() => setWaiting(false)}
        onEnded={() => setPlaying(false)}
        onVolumeChange={() => {
          if (videoRef.current) {
            setMuted(videoRef.current.muted);
            setVolume(videoRef.current.volume);
          }
        }}
      />

      {/* Buffering spinner */}
      {waiting && (
        <div style={p.spinnerWrap}>
          <div style={p.spinner} />
        </div>
      )}

      {/* Big play/pause indicator on click */}
      {!playing && !waiting && (
        <div style={p.bigPlay} onClick={togglePlay}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="rgba(0,0,0,0.55)" />
            <polygon points="24,16 52,32 24,48" fill="white" />
          </svg>
        </div>
      )}

      {/* Controls overlay */}
      <div style={{ ...p.controls, opacity: showControls ? 1 : 0, transition: "opacity 0.3s" }}>
        {/* Gradient */}
        <div style={p.gradient} />

        {/* Progress bar */}
        <div
          ref={progressRef}
          style={p.progressTrack}
          onClick={onProgressClick}
          onMouseDown={() => setSeeking(true)}
          onMouseUp={() => setSeeking(false)}
        >
          <div style={{ ...p.progressFill, background: "rgba(255,255,255,0.25)", width: `${bufferedPct}%` }} />
          <div style={{ ...p.progressFill, background: "#ff4444", width: `${progress}%` }}>
            <div style={p.thumb} />
          </div>
        </div>

        {/* Bottom row */}
        <div style={p.bottomRow}>
          {/* Left controls */}
          <div style={p.controlGroup}>
            {/* Play/pause */}
            <button style={p.iconBtn} onClick={togglePlay} title={playing ? "Pause (k)" : "Play (k)"}>
              {playing ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
              )}
            </button>

            {/* Volume */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button style={p.iconBtn} onClick={toggleMute} title="Mute (m)">
                <span style={{ fontSize: 16 }}>{volumeIcon}</span>
              </button>
              <div
                ref={volumeRef}
                style={{ ...p.progressTrack, width: 72, margin: 0 }}
                onClick={onVolumeClick}
              >
                <div style={{ ...p.progressFill, background: "rgba(255,255,255,0.3)", width: "100%" }} />
                <div style={{ ...p.progressFill, background: "white", width: `${volPct}%` }}>
                  <div style={p.thumb} />
                </div>
              </div>
            </div>

            {/* Time */}
            <span style={p.time}>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          {/* Right controls */}
          <div style={p.controlGroup}>
            {/* Playback speed */}
            <div style={{ position: "relative" }}>
              <button
                style={{ ...p.iconBtn, fontSize: 13, fontWeight: 700, color: "white", minWidth: 36 }}
                onClick={() => setShowSpeedMenu(s => !s)}
                title="Playback speed"
              >
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div style={p.speedMenu}>
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(r => (
                    <button
                      key={r}
                      style={{ ...p.speedItem, background: playbackRate === r ? "#ff4444" : "transparent" }}
                      onClick={() => setSpeed(r)}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button style={p.iconBtn} onClick={toggleFullscreen} title="Fullscreen (f)">
              {fullscreen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 01-2 2H3M21 8h-3a2 2 0 01-2-2V3M3 16h3a2 2 0 012 2v3M16 21v-3a2 2 0 012-2h3"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Watch Page ───────────────────────────────────────────────────────────────
export default function Watch() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/videos/${id}`)
      .then(({ data }) => { setVideo(data); setLikeCount(Number(data.like_count)); })
      .catch((e) => setError(e.response?.data?.error || "Failed to load video."))
      .finally(() => setLoading(false));

    api.get(`/videos/${id}/comments`).then(({ data }) => setComments(data));
    if (user) api.get(`/videos/${id}/liked`).then(({ data }) => setLiked(data.liked));
  }, [id, user]);

  async function handleLike() {
    if (!user) return navigate("/login");
    try {
      if (liked) {
        const { data } = await api.delete(`/videos/${id}/like`);
        setLikeCount(data.like_count); setLiked(false);
      } else {
        const { data } = await api.post(`/videos/${id}/like`);
        setLikeCount(data.like_count); setLiked(true);
      }
    } catch {}
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/videos/${id}/comments`, { body: commentText });
      setComments((prev) => [data, ...prev]);
      setCommentText("");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to post comment.");
    } finally { setSubmitting(false); }
  }

  async function deleteComment(cid) {
    if (!confirm("Delete this comment?")) return;
    await api.delete(`/videos/${id}/comments/${cid}`);
    setComments((prev) => prev.filter((c) => c.id !== cid));
  }

  async function deleteVideo() {
    if (!confirm("Permanently delete this video?")) return;
    await api.delete(`/videos/${id}`);
    navigate("/");
  }

  if (loading) return <div className="spinner" style={{ marginTop: "5rem" }} />;
  if (error) return (
    <div className="page center">
      <p style={{ color: "#f87171", fontSize: "1.2rem", marginTop: "4rem" }}>{error}</p>
      <Link to="/"><button className="btn-ghost" style={{ marginTop: "1rem" }}>← Back</button></Link>
    </div>
  );

  const poster = video.thumbnail ? `/uploads/thumbnails/${video.thumbnail}` : undefined;

  return (
    <div className="page" style={{ maxWidth: 960 }}>
      {/* Custom player */}
      <VideoPlayer src={`/uploads/videos/${video.filename}`} poster={poster} />

      {/* Title & actions */}
      <div style={s.titleRow}>
        <div style={{ flex: 1 }}>
          <h1 style={s.title}>{video.title}</h1>
          <p style={s.meta}>
            {video.view_count.toLocaleString()} views · {timeAgo(video.created_at)} · {video.uploader_username}
            {" "}<span className={`badge badge-${video.visibility}`}>{video.visibility}</span>
          </p>
        </div>
        <div style={s.actions}>
          <button
            onClick={handleLike}
            style={{ ...s.likeBtn, background: liked ? "#7f1d1d" : "var(--surface2)", color: liked ? "#fca5a5" : "var(--text)" }}
          >
            ♥ {likeCount}
          </button>
          {isAdmin && (
            <>
              <Link to={`/admin/edit/${video.id}`}><button className="btn-ghost">Edit</button></Link>
              <button className="btn-danger" onClick={deleteVideo}>Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {video.description && <div style={s.description}>{video.description}</div>}

      <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "1.5rem 0" }} />

      {/* Comments */}
      <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>
        {comments.length} Comment{comments.length !== 1 ? "s" : ""}
      </h3>

      {user ? (
        <form onSubmit={submitComment} style={{ marginBottom: "0.5rem" }}>
          <textarea
            rows={3} placeholder="Add a comment..." value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={{ resize: "vertical" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button className="btn-primary" type="submit" disabled={submitting || !commentText.trim()}>
              {submitting ? "Posting..." : "Comment"}
            </button>
          </div>
        </form>
      ) : (
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          <Link to="/login" style={{ color: "var(--accent)" }}>Log in</Link> to leave a comment.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
        {comments.map((c) => (
          <div key={c.id} style={s.comment}>
            <div style={s.commentHeader}>
              <span style={s.commentAuthor}>{c.username}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{timeAgo(c.created_at)}</span>
              {(user?.id === c.user_id || isAdmin) && (
                <button onClick={() => deleteComment(c.id)}
                  style={{ marginLeft: "auto", background: "none", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  Delete
                </button>
              )}
            </div>
            <p style={s.commentBody}>{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Player styles ────────────────────────────────────────────────────────────
const p = {
  wrap: {
    position: "relative",
    background: "#000",
    borderRadius: 10,
    overflow: "hidden",
    aspectRatio: "16/9",
    marginBottom: "1rem",
    userSelect: "none",
  },
  video: { width: "100%", height: "100%", display: "block" },
  spinnerWrap: {
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.3)",
  },
  spinner: {
    width: 40, height: 40,
    border: "3px solid rgba(255,255,255,0.2)",
    borderTop: "3px solid white",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  bigPlay: {
    position: "absolute", inset: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
  },
  controls: {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column", justifyContent: "flex-end",
    pointerEvents: "none",
  },
  gradient: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: "40%",
    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
    pointerEvents: "none",
  },
  progressTrack: {
    position: "relative",
    height: 4,
    background: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    margin: "0 14px 10px",
    cursor: "pointer",
    pointerEvents: "all",
    flexShrink: 0,
  },
  progressFill: {
    position: "absolute",
    top: 0, left: 0, bottom: 0,
    borderRadius: 999,
    transition: "width 0.1s linear",
  },
  thumb: {
    position: "absolute",
    right: -5, top: "50%",
    transform: "translateY(-50%)",
    width: 12, height: 12,
    background: "#ff4444",
    borderRadius: "50%",
    boxShadow: "0 0 4px rgba(0,0,0,0.6)",
  },
  bottomRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 8px 10px",
    pointerEvents: "all",
    gap: 4,
  },
  controlGroup: { display: "flex", alignItems: "center", gap: 4 },
  iconBtn: {
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
    padding: "6px 8px",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  time: { color: "rgba(255,255,255,0.85)", fontSize: "0.8rem", whiteSpace: "nowrap", padding: "0 4px" },
  speedMenu: {
    position: "absolute",
    bottom: "110%",
    right: 0,
    background: "rgba(20,20,20,0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    overflow: "hidden",
    minWidth: 80,
    backdropFilter: "blur(8px)",
    zIndex: 10,
  },
  speedItem: {
    display: "block",
    width: "100%",
    padding: "7px 14px",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    textAlign: "center",
  },
};

// ─── Page styles ──────────────────────────────────────────────────────────────
const s = {
  titleRow: { display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "0.25rem" },
  title: { fontSize: "1.3rem", fontWeight: 700, lineHeight: 1.3 },
  meta: { color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  actions: { display: "flex", gap: 8, flexShrink: 0, alignItems: "center" },
  likeBtn: { padding: "0.5rem 1rem", borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" },
  description: { marginTop: "1rem", background: "var(--surface)", borderRadius: 8, padding: "0.9rem 1rem", fontSize: "0.9rem", whiteSpace: "pre-wrap", lineHeight: 1.6 },
  comment: { background: "var(--surface)", borderRadius: 8, padding: "0.8rem 1rem" },
  commentHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  commentAuthor: { fontWeight: 600, fontSize: "0.875rem" },
  commentBody: { fontSize: "0.9rem", lineHeight: 1.5 },
};