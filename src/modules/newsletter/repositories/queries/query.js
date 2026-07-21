const SELECT_COLUMNS = `
  id, name, description, frequency, is_active, created_at,
  name_en, description_en, name_uz, description_uz
`;

class NewsletterQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit }) {
    const offset = (page - 1) * limit;
    const rowsQuery = `
      SELECT ${SELECT_COLUMNS}
      FROM newsletters
      WHERE is_active = true
      ORDER BY name ASC, id ASC
      LIMIT $1 OFFSET $2;
    `;
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM newsletters
      WHERE is_active = true;
    `;

    const [rows, count] = await Promise.all([
      this.db.executeQuery(rowsQuery, [limit, offset]),
      this.db.executeQuery(countQuery, []),
    ]);

    return { rows, count };
  }

  async findOneById(id) {
    return this.db.executeQuery(
      `SELECT ${SELECT_COLUMNS}
       FROM newsletters
       WHERE id = $1
       LIMIT 1;`,
      [id]
    );
  }

  async findOneByName(name) {
    return this.db.executeQuery(
      `SELECT ${SELECT_COLUMNS}
       FROM newsletters
       WHERE name = $1
       LIMIT 1;`,
      [name]
    );
  }

  async findArticlesByNewsletterId(newsletterId) {
    return this.db.executeQuery(
      `SELECT
         a.id,
         a.title,
         a.slug,
         a.summary,
         a.featured_image,
         a.status,
         a.published_at,
         a.created_at,
         u.id AS author_id,
         u.full_name AS author_full_name,
         c.id AS category_id,
         c.name AS category_name
       FROM newsletter_articles na
       INNER JOIN articles a ON a.id = na.article_id
       INNER JOIN users u ON u.id = a.author_id
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE na.newsletter_id = $1
         AND a.deleted_at IS NULL
         AND a.status = 'published'
       ORDER BY na.display_order ASC, a.id ASC;`,
      [newsletterId]
    );
  }

  async findOneArticleById(articleId) {
    return this.db.executeQuery(
      `SELECT id FROM articles WHERE id = $1 AND deleted_at IS NULL LIMIT 1;`,
      [articleId]
    );
  }

  async findNewsletterArticle(newsletterId, articleId) {
    return this.db.executeQuery(
      `SELECT newsletter_id, article_id, display_order
       FROM newsletter_articles
       WHERE newsletter_id = $1 AND article_id = $2
       LIMIT 1;`,
      [newsletterId, articleId]
    );
  }

  async findSubscriber(newsletterId, userId) {
    return this.db.executeQuery(
      `SELECT newsletter_id, user_id, subscribed_at
       FROM newsletter_subscribers
       WHERE newsletter_id = $1 AND user_id = $2
       LIMIT 1;`,
      [newsletterId, userId]
    );
  }
}

module.exports = NewsletterQuery;
