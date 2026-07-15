const collection = "notifications";

class NotificationQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ user_id, page, limit, status, channel }) {
    const offset = (page - 1) * limit;

    const rowsQuery = `
      SELECT id, user_id, title, message, channel, status, sent_at, read_at, created_at
      FROM ${collection}
      WHERE user_id = $1
        AND ($2::text IS NULL OR status::text = $2)
        AND ($3::text IS NULL OR channel::text = $3)
      ORDER BY created_at DESC, id DESC
      LIMIT $4 OFFSET $5;
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection}
      WHERE user_id = $1
        AND ($2::text IS NULL OR status::text = $2)
        AND ($3::text IS NULL OR channel::text = $3);
    `;

    const unreadCountQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection}
      WHERE user_id = $1
        AND status::text != 'read';
    `;

    const [rows, count, unreadCount] = await Promise.all([
      this.db.executeQuery(rowsQuery, [user_id, status || null, channel || null, limit, offset]),
      this.db.executeQuery(countQuery, [user_id, status || null, channel || null]),
      this.db.executeQuery(unreadCountQuery, [user_id]),
    ]);

    return { rows, count, unreadCount };
  }

  async findOneById(id) {
    return this.db.executeQuery(
      `SELECT id, user_id, title, message, channel, status, sent_at, read_at, created_at
       FROM ${collection}
       WHERE id = $1
       LIMIT 1;`,
      [id]
    );
  }
}

module.exports = NotificationQuery;
