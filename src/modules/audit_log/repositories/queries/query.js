const collection = "audit_logs";

class AuditLogQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit, user_id, table_name, action, from, to }) {
    const offset = (page - 1) * limit;

    const rowsQuery = `
      SELECT al.id, al.user_id, al.table_name, al.record_id, al.action,
             al.old_data, al.new_data, al.ip_address, al.user_agent, al.created_at,
             u.full_name AS user_full_name
      FROM ${collection} al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE ($1::uuid IS NULL OR al.user_id = $1)
        AND ($2::text IS NULL OR al.table_name = $2)
        AND ($3::text IS NULL OR al.action = $3)
        AND ($4::timestamptz IS NULL OR al.created_at >= $4)
        AND ($5::timestamptz IS NULL OR al.created_at <= $5)
      ORDER BY al.created_at DESC, al.id DESC
      LIMIT $6 OFFSET $7;
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection}
      WHERE ($1::uuid IS NULL OR user_id = $1)
        AND ($2::text IS NULL OR table_name = $2)
        AND ($3::text IS NULL OR action = $3)
        AND ($4::timestamptz IS NULL OR created_at >= $4)
        AND ($5::timestamptz IS NULL OR created_at <= $5);
    `;

    const filterValues = [
      user_id || null,
      table_name || null,
      action || null,
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
      `SELECT id, user_id, table_name, record_id, action, old_data, new_data, ip_address, user_agent, created_at
       FROM ${collection}
       WHERE id = $1
       LIMIT 1;`,
      [id]
    );
  }
}

module.exports = AuditLogQuery;
