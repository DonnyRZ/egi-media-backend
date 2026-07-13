const collection = "topics";

class TopicCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({ id, name, slug, description, created_at, updated_at }) {
    return this.db.executeQuery(
      `INSERT INTO ${collection} (id, name, slug, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, slug, description, created_at, updated_at;`,
      [id, name, slug, description, created_at, updated_at]
    );
  }

  async updateOne({ id, name, slug, description, updated_at }) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET name = $1, slug = $2, description = $3, updated_at = $4
       WHERE id = $5
       RETURNING id, name, slug, description, created_at, updated_at;`,
      [name, slug, description, updated_at, id]
    );
  }

  async deleteOne(id) {
    return this.db.executeQuery(
      `WITH removed_followers AS (
         DELETE FROM topic_followers WHERE topic_id = $1
       )
       DELETE FROM ${collection}
       WHERE id = $1
       RETURNING id, name, slug, description, created_at, updated_at;`,
      [id]
    );
  }

  async createFollower({ topic_id, user_id, created_at }) {
    return this.db.executeQuery(
      `INSERT INTO topic_followers (topic_id, user_id, created_at)
       VALUES ($1, $2, $3)
       RETURNING topic_id, user_id, created_at;`,
      [topic_id, user_id, created_at]
    );
  }

  async deleteFollower({ topic_id, user_id }) {
    return this.db.executeQuery(
      `DELETE FROM topic_followers
       WHERE topic_id = $1 AND user_id = $2
       RETURNING topic_id, user_id, created_at;`,
      [topic_id, user_id]
    );
  }
}

module.exports = TopicCommand;
