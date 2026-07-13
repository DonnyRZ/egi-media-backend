const collection = "topics";

class TopicQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit, search }) {
    const offset = (page - 1) * limit;
    const searchValue = search ? `%${search}%` : null;
    const rowsQuery = `
      SELECT id, name, slug, description, created_at, updated_at
      FROM ${collection}
      WHERE ($1::text IS NULL OR name ILIKE $1 OR slug ILIKE $1)
      ORDER BY name ASC, id ASC
      LIMIT $2 OFFSET $3;
    `;
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection}
      WHERE ($1::text IS NULL OR name ILIKE $1 OR slug ILIKE $1);
    `;
    const [rows, count] = await Promise.all([
      this.db.executeQuery(rowsQuery, [searchValue, limit, offset]),
      this.db.executeQuery(countQuery, [searchValue]),
    ]);
    return { rows, count };
  }

  async findOneById(id) {
    return this.db.executeQuery(
      `SELECT id, name, slug, description, created_at, updated_at FROM ${collection} WHERE id = $1 LIMIT 1;`,
      [id]
    );
  }

  async findOneBySlug(slug) {
    return this.db.executeQuery(
      `SELECT id, name, slug, description, created_at, updated_at FROM ${collection} WHERE slug = $1 LIMIT 1;`,
      [slug]
    );
  }

  async hasArticleReference(id) {
    return this.db.executeQuery(
      "SELECT EXISTS (SELECT 1 FROM article_topics WHERE topic_id = $1) AS exists;",
      [id]
    );
  }

  async findFollower({ topic_id, user_id }) {
    return this.db.executeQuery(
      "SELECT topic_id, user_id, created_at FROM topic_followers WHERE topic_id = $1 AND user_id = $2 LIMIT 1;",
      [topic_id, user_id]
    );
  }
}

module.exports = TopicQuery;
