const collection = "topics";

const SELECT_COLUMNS = `
  t.id, t.name, t.slug, t.description, t.category_id,
  t.name_en, t.slug_en, t.description_en,
  t.name_uz, t.slug_uz, t.description_uz,
  t.created_at, t.updated_at,
  c.name AS category_name,
  c.name_en AS category_name_en,
  c.name_uz AS category_name_uz,
  c.slug AS category_slug
`;

class TopicQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit, search }) {
    const offset = (page - 1) * limit;
    const searchValue = search ? `%${search}%` : null;
    const rowsQuery = `
      SELECT ${SELECT_COLUMNS},
        (SELECT COUNT(*)::int FROM article_topics at2
         JOIN articles a ON a.id = at2.article_id
         WHERE at2.topic_id = t.id AND a.deleted_at IS NULL
           AND a.status = 'published' AND a.translation_status = 'ready') AS article_count
      FROM ${collection} t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE (
        $1::text IS NULL
        OR t.name ILIKE $1 OR t.slug ILIKE $1 OR t.description ILIKE $1
        OR t.name_en ILIKE $1 OR t.slug_en ILIKE $1 OR t.description_en ILIKE $1
        OR t.name_uz ILIKE $1 OR t.slug_uz ILIKE $1 OR t.description_uz ILIKE $1
      )
      ORDER BY t.name ASC, t.id ASC
      LIMIT $2 OFFSET $3;
    `;
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection} t
      WHERE (
        $1::text IS NULL
        OR t.name ILIKE $1 OR t.slug ILIKE $1 OR t.description ILIKE $1
        OR t.name_en ILIKE $1 OR t.slug_en ILIKE $1 OR t.description_en ILIKE $1
        OR t.name_uz ILIKE $1 OR t.slug_uz ILIKE $1 OR t.description_uz ILIKE $1
      );
    `;
    const [rows, count] = await Promise.all([
      this.db.executeQuery(rowsQuery, [searchValue, limit, offset]),
      this.db.executeQuery(countQuery, [searchValue]),
    ]);
    return { rows, count };
  }

  async findOneById(id) {
    return this.db.executeQuery(
      `SELECT ${SELECT_COLUMNS}
       FROM ${collection} t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1
       LIMIT 1;`,
      [id]
    );
  }

  async findOneBySlug(slug) {
    return this.db.executeQuery(
      `SELECT ${SELECT_COLUMNS}
       FROM ${collection} t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.slug = $1 OR t.slug_en = $1 OR t.slug_uz = $1
       LIMIT 1;`,
      [slug]
    );
  }

  async findCategoryById(id) {
    return this.db.executeQuery(
      `SELECT id, name, slug FROM categories WHERE id = $1 LIMIT 1;`,
      [id]
    );
  }

  async hasArticleReference(id) {
    return this.db.executeQuery(
      `SELECT EXISTS (
         SELECT 1
         FROM article_topics at2
         INNER JOIN articles a ON a.id = at2.article_id
         WHERE at2.topic_id = $1
           AND a.deleted_at IS NULL
       ) AS exists;`,
      [id]
    );
  }

  async hasChildSeries(id) {
    return this.db.executeQuery(
      `SELECT EXISTS (
         SELECT 1 FROM series
         WHERE topic_id = $1
       ) AS exists;`,
      [id]
    );
  }

  async findFollower({ topic_id, user_id }) {
    return this.db.executeQuery(
      `SELECT topic_id, user_id, created_at
       FROM user_topic_subscriptions
       WHERE topic_id = $1 AND user_id = $2
       LIMIT 1;`,
      [topic_id, user_id]
    );
  }
}

module.exports = TopicQuery;
