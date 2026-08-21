const { randomUUID } = require("crypto");
const logger = require("./logger");

const ctx = "ReviewNotifier";

async function resolveActorName(db, actorId, fallback) {
  if (fallback) return fallback;
  if (!actorId) return "Author";

  const result = await db.executeQuery(
    `SELECT full_name FROM users WHERE id = $1 LIMIT 1;`,
    [actorId]
  );
  return result?.rows?.[0]?.full_name || "Author";
}

async function findEditorIds(db) {
  const result = await db.executeQuery(
    `SELECT id
     FROM users
     WHERE role::text IN ('superadmin', 'admin')
       AND deleted_at IS NULL;`,
    []
  );
  return (result?.rows ?? []).map((row) => row.id);
}

async function insertEditorNotification(db, userId, title, message) {
  return db.executeQuery(
    `INSERT INTO notifications (
       id, user_id, title, message, channel, status, sent_at, created_at
     )
     VALUES ($1, $2, $3, $4, 'in_app', 'sent', NOW(), NOW());`,
    [randomUUID(), userId, title, message]
  );
}

/**
 * In-app alert for superadmins when an author submits content for review.
 * Used by articles and videos.
 */
async function notifyEditorsOfSubmission({
  db,
  actorId,
  actorName,
  resourceLabel,
  title,
}) {
  try {
    const name = await resolveActorName(db, actorId, actorName);
    const editors = await findEditorIds(db);
    if (editors.length === 0) return;

    const headline = `New ${resourceLabel} for review`;
    const message = `Author ${name} submitted a new ${resourceLabel} for review${
      title ? `: "${title}"` : ""
    }`;

    await Promise.all(
      editors.map((editorId) =>
        insertEditorNotification(db, editorId, headline, message)
      )
    );
  } catch (error) {
    logger.error(ctx, "notifyEditorsOfSubmission", "Failed to notify editors", {
      resourceLabel,
      error: error?.message || error,
    });
  }
}

module.exports = {
  notifyEditorsOfSubmission,
};
