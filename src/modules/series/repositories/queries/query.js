const collection = "series";

const SELECT_COLUMNS = `
  s.id, s.name, s.slug, s.description, s.image, s.topic_id, s.author_id, s.created_at,
  s.name_en, s.slug_en, s.description_en,
  s.name_uz, s.slug_uz, s.description_uz,
  t.name AS topic_name,
  t.name_en AS topic_name_en,
  t.name_uz AS topic_name_uz,
  t.slug AS topic_slug
`;

class SeriesQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit, search, topic_id }) {
    const offset = (page - 1) * limit;
    const searchValue = search ? `%${search}%` : null;
    const rowsQuery = `
      SELECT
        s.id, s.name, s.slug, s.description, s.image, s.topic_id, s.created_at,
        s.name_en, s.slug_en, s.description_en,
        s.name_uz, s.slug_uz, s.description_uz,
        t.name AS topic_name,
        t.name_en AS topic_name_en,
        t.name_uz AS topic_name_uz,
        t.slug AS topic_slug,
        (SELECT COUNT(*)::int FROM articles a
         WHERE a.series_id = s.id AND a.deleted_at IS NULL
           AND a.status = 'published' AND a.translation_status = 'ready') AS article_count
      FROM ${collection} s
      LEFT JOIN topics t ON t.id = s.topic_id
      WHERE (
        $1::text IS NULL
        OR s.name ILIKE $1 OR s.slug ILIKE $1 OR s.description ILIKE $1
        OR s.name_en ILIKE $1 OR s.slug_en ILIKE $1 OR s.description_en ILIKE $1
        OR s.name_uz ILIKE $1 OR s.slug_uz ILIKE $1 OR s.description_uz ILIKE $1
      )
      AND ($4::uuid IS NULL OR s.topic_id=$4)
      ORDER BY s.name ASC, s.id ASC
      LIMIT $2 OFFSET $3;
    `;
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection} s
      WHERE (
        $1::text IS NULL
        OR s.name ILIKE $1 OR s.slug ILIKE $1 OR s.description ILIKE $1
        OR s.name_en ILIKE $1 OR s.slug_en ILIKE $1 OR s.description_en ILIKE $1
        OR s.name_uz ILIKE $1 OR s.slug_uz ILIKE $1 OR s.description_uz ILIKE $1
      ) AND ($2::uuid IS NULL OR s.topic_id=$2);
    `;

    const [rows, count] = await Promise.all([
      this.db.executeQuery(rowsQuery, [searchValue, limit, offset,topic_id||null]),
      this.db.executeQuery(countQuery, [searchValue,topic_id||null]),
    ]);

    return { rows, count };
  }

  async findOneById(id) {
    return this.db.executeQuery(
      `SELECT ${SELECT_COLUMNS}
       FROM ${collection} s
       LEFT JOIN topics t ON t.id = s.topic_id
       WHERE s.id = $1
       LIMIT 1;`,
      [id]
    );
  }

  async findOneBySlug(slug) {
    return this.db.executeQuery(
      `SELECT ${SELECT_COLUMNS}
       FROM ${collection} s
       LEFT JOIN topics t ON t.id = s.topic_id
       WHERE s.slug = $1 OR s.slug_en = $1 OR s.slug_uz = $1
       LIMIT 1;`,
      [slug]
    );
  }

  async findTopicById(id) {
    return this.db.executeQuery(
      `SELECT id, name, slug FROM topics WHERE id = $1 LIMIT 1;`,
      [id]
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
         AND a.translation_status = 'ready'
       ORDER BY a.published_at DESC NULLS LAST, a.id ASC;`,
      [seriesId]
    );
  }

  async hasArticleReference(id) {
    return this.db.executeQuery(
      `SELECT EXISTS (
         SELECT 1 FROM articles
         WHERE series_id = $1
           AND deleted_at IS NULL
       ) AS exists;`,
      [id]
    );
  }
}

module.exports = SeriesQuery;
