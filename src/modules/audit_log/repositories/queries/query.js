const collection = "audit_logs";

class AuditLogQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit, user_id, table_name, action, search, from, to }) {
    const offset = (page - 1) * limit;
    const searchTerm = search ? `%${search}%` : null;

    const filters = `
      WHERE ($1::uuid IS NULL OR al.user_id = $1)
        AND ($2::text IS NULL OR al.table_name = $2)
        AND ($3::text IS NULL OR al.action = $3)
        AND (
          $4::text IS NULL
          OR u.full_name ILIKE $4
        )
        AND ($5::timestamptz IS NULL OR al.created_at >= $5)
        AND ($6::timestamptz IS NULL OR al.created_at <= $6)
    `;

    const rowsQuery = `
      SELECT al.id, al.user_id, al.table_name, al.record_id, al.action,
             al.old_data, al.new_data, al.ip_address, al.user_agent,
             al.article_title, al.created_at,
             u.full_name AS user_full_name,
             u.role AS user_role
      FROM ${collection} al
      LEFT JOIN users u ON u.id = al.user_id
      ${filters}
      ORDER BY al.created_at DESC, al.id DESC
      LIMIT $7 OFFSET $8;
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection} al
      LEFT JOIN users u ON u.id = al.user_id
      ${filters};
    `;

    const filterValues = [
      user_id || null,
      table_name || null,
      action || null,
      searchTerm,
      from || null,
      to || null,
    ];

    const [rows, count] = await Promise.all([
      this.db.executeQuery(rowsQuery, [...filterValues, limit, offset]),
      this.db.executeQuery(countQuery, filterValues),
    ]);

    return { rows, count };
  }

  async findOneById(id) {
    return this.db.executeQuery(
      `SELECT al.id, al.user_id, al.table_name, al.record_id, al.action,
              al.old_data, al.new_data, al.ip_address, al.user_agent,
              al.article_title, al.created_at,
              u.full_name AS user_full_name,
              u.role AS user_role
       FROM ${collection} al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.id = $1
       LIMIT 1;`,
      [id],
    );
  }
}

module.exports = AuditLogQuery;
