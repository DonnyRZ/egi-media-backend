const { v4: uuidv4 } = require("uuid");
const wrapper = require("./wrapper");
const logger = require("./logger");

const ctx = "AuditLog";

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
}) {
  try {
    const query = `
      INSERT INTO audit_logs (
        id, user_id, table_name, record_id, action,
        old_data, new_data, ip_address, user_agent, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::json, $7::json, $8, $9, NOW())
      RETURNING id
    `;

    const values = [
      uuidv4(),
      user_id,
      table_name,
      record_id,
      action,
      old_data ? JSON.stringify(old_data) : null,
      new_data ? JSON.stringify(new_data) : null,
      ip_address,
      user_agent,
    ];

    const result = await db.executeQuery(query, values);
    return wrapper.data(result.rows?.[0] ?? true);
  } catch (error) {
    logger.error(ctx, "insertAuditLog", "Failed to write audit log", error);
    return wrapper.error(error);
  }
}

module.exports = {
  insertAuditLog,
};
