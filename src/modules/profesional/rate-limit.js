const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;

const hits = new Map();

function clientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function consumeRateLimit(ip, now = Date.now()) {
  const current = hits.get(ip);
  if (!current || now >= current.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= MAX_HITS;
}

function resetRateLimit() {
  hits.clear();
}

module.exports = {
  WINDOW_MS,
  MAX_HITS,
  clientIp,
  consumeRateLimit,
  resetRateLimit,
};
