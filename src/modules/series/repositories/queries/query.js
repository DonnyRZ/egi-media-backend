const collection = "series";

const SELECT_COLUMNS = `
  id, name, slug, description, author_id, created_at,
  name_en, slug_en, description_en,
  name_uz, slug_uz, description_uz
`;

class SeriesQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit, search }) {
    const offset = (page - 1) * limit;
    const searchValue = search ? `%${search}%` : null;
    const rowsQuery = `
      SELECT
        id, name, slug, description, created_at,
        name_en, slug_en, description_en,
        name_uz, slug_uz, description_uz
      FROM ${collection}
      WHERE (
        $1::text IS NULL
        OR name ILIKE $1 OR slug ILIKE $1 OR description ILIKE $1
        OR name_en ILIKE $1 OR slug_en ILIKE $1 OR description_en ILIKE $1
        OR name_uz ILIKE $1 OR slug_uz ILIKE $1 OR description_uz ILIKE $1
      )
      ORDER BY name ASC, id ASC
      LIMIT $2 OFFSET $3;
    `;
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection}
      WHERE (
        $1::text IS NULL
        OR name ILIKE $1 OR slug ILIKE $1 OR description ILIKE $1
        OR name_en ILIKE $1 OR slug_en ILIKE $1 OR description_en ILIKE $1
        OR name_uz ILIKE $1 OR slug_uz ILIKE $1 OR description_uz ILIKE $1
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
       FROM ${collection}
       WHERE id = $1
       LIMIT 1;`,
      [id]
    );
  }

  async findOneBySlug(slug) {
    return this.db.executeQuery(
      `SELECT ${SELECT_COLUMNS}
       FROM ${collection}
       WHERE slug = $1 OR slug_en = $1 OR slug_uz = $1
       LIMIT 1;`,
      [slug]
    );
  }

  async findPublishedArticlesBySeriesId(seriesId) {
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
       FROM articles a
       INNER JOIN users u ON u.id = a.author_id
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.series_id = $1
         AND a.deleted_at IS NULL
         AND a.status = 'published'
       ORDER BY a.published_at DESC NULLS LAST, a.id ASC;`,
      [seriesId]
    );
  }

  async hasArticleReference(id) {
    return this.db.executeQuery(
      "SELECT EXISTS (SELECT 1 FROM articles WHERE series_id = $1) AS exists;",
      [id]
    );
  }
}

module.exports = SeriesQuery;
