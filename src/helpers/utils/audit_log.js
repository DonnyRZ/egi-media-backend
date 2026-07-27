const { v4: uuidv4 } = require("uuid");
const wrapper = require("./wrapper");
const logger = require("./logger");

const ctx = "AuditLog";

const TABLE_TO_RESOURCE_TYPE = {
  articles: "Article",
  columns: "Column",
  youtube_videos: "Video",
  categories: "Category",
  topics: "Topic",
  series: "Series",
  tags: "Tag",
  users: "User",
  newsletters: "Newsletter",
};

function normalizeIpAddress(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // X-Forwarded-For may contain a proxy chain: take the first hop, then cap length.
  const firstHop = String(value).split(",")[0].trim();
  if (!firstHop) return null;
  return firstHop.slice(0, 255);
}

function extractArticleTitle(oldData, newData) {
  const sources = [newData, oldData];
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    const candidate = source.article_title ?? source.title;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim().slice(0, 255);
    }
  }
  return null;
}

/**
 * Resolve a display resource type for audit rows.
 * Prefer an explicit value; otherwise map from table_name.
 */
function resolveResourceType(resourceType, tableName) {
  if (typeof resourceType === "string" && resourceType.trim()) {
    return resourceType.trim().slice(0, 50);
  }

  const key = String(tableName || "")
    .trim()
    .toLowerCase();
  if (!key) return "Unknown";
  if (TABLE_TO_RESOURCE_TYPE[key]) return TABLE_TO_RESOURCE_TYPE[key];

  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .slice(0, 50);
}

/**
 * Best-effort audit insert. Failures are logged but do not fail the parent
 * business operation — activity trail should not block mutations.
 */
async function insertAuditLog(db, {
  user_id = null,
  table_name,
  record_id = null,
  action,
  old_data = null,
  new_data = null,
  ip_address = null,
  user_agent = null,
  article_title = null,
  resource_type = null,
}) {
  try {
    const resolvedTitle =
      (typeof article_title === "string" && article_title.trim()
        ? article_title.trim().slice(0, 255)
        : null) ?? extractArticleTitle(old_data, new_data);
    const resolvedResourceType = resolveResourceType(resource_type, table_name);

    const query = `
      INSERT INTO audit_logs (
        id, user_id, table_name, record_id, action,
        old_data, new_data, ip_address, user_agent, article_title,
        resource_type, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::json, $7::json, $8, $9, $10, $11, NOW())
      RETURNING id
    `;

    const values = [
      uuidv4(),
      user_id || null,
      table_name,
      record_id || null,
      action,
      old_data ? JSON.stringify(old_data) : null,
      new_data ? JSON.stringify(new_data) : null,
      normalizeIpAddress(ip_address),
      user_agent || null,
      resolvedTitle,
      resolvedResourceType,
    ];

    const result = await db.executeQuery(query, values);
    if (!result || !result.rows) {
      logger.error(ctx, "insertAuditLog", "Audit insert returned no result", {
        table_name,
        resource_type: resolvedResourceType,
        record_id,
        action,
        user_id,
      });
      return wrapper.error(new Error("Audit insert failed"));
    }

    return wrapper.data(result.rows[0]);
  } catch (error) {
    logger.error(ctx, "insertAuditLog", "Failed to write audit log", error);
    return wrapper.error(error);
  }
}

module.exports = {
  insertAuditLog,
  normalizeIpAddress,
  extractArticleTitle,
  resolveResourceType,
  TABLE_TO_RESOURCE_TYPE,
};
