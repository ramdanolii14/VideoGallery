import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token provided." });

  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {}
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}
