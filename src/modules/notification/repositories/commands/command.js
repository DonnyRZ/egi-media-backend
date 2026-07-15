const collection = "notifications";

class NotificationCommand {
  constructor(db) {
    this.db = db;
  }

  async updateStatusToRead(id, readAt) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET status = 'read', read_at = $2
       WHERE id = $1
       RETURNING id, user_id, title, message, channel, status, sent_at, read_at, created_at;`,
      [id, readAt]
    );
  }

  async updateAllStatusToRead(user_id, readAt) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET status = 'read', read_at = $2
       WHERE user_id = $1 AND status::text != 'read'
       RETURNING id;`,
      [user_id, readAt]
    );
  }
}

module.exports = NotificationCommand;
