const collection = "audit_logs";

class AuditLogQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit, user_id, table_name, action, from, to }) {
    const offset = (page - 1) * limit;

    const rowsQuery = `
      SELECT id, user_id, table_name, record_id, action, old_data, new_data, ip_address, user_agent, created_at
      FROM ${collection}
      WHERE ($1::uuid IS NULL OR user_id = $1)
        AND ($2::text IS NULL OR table_name = $2)
        AND ($3::text IS NULL OR action = $3)
        AND ($4::timestamptz IS NULL OR created_at >= $4)
        AND ($5::timestamptz IS NULL OR created_at <= $5)
      ORDER BY created_at DESC, id DESC
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
