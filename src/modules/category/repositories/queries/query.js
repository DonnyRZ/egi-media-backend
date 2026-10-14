const collection = "categories";

const SELECT_COLUMNS = `
  id, name, slug, description,
  name_en, slug_en, description_en,
  name_uz, slug_uz, description_uz,
  created_at, updated_at
`;

class CategoryQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit, search }) {
    const offset = (page - 1) * limit;
    const searchValue = search ? `%${search}%` : null;
    const rowsQuery = `
      SELECT ${SELECT_COLUMNS},
        (SELECT COUNT(*)::int FROM articles a
         WHERE a.category_id = ${collection}.id AND a.deleted_at IS NULL
           AND a.status = 'published' AND a.translation_status = 'ready') AS article_count
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
      `SELECT ${SELECT_COLUMNS} FROM ${collection} WHERE id = $1 LIMIT 1;`,
      [id]
    );
  }

  async findTranslationStates(id) {
    return this.db.executeQuery(
      `SELECT locale, name_origin, description_origin,
              name_source_text, description_source_text, status, last_error,
              updated_at
       FROM category_translation_state
       WHERE category_id = $1
       ORDER BY locale ASC;`,
      [id]
    );
  }

  async findTranslationStateDetail(id) {
    return this.db.executeQuery(
      `SELECT c.id, c.name, c.description,
              c.name_en, c.slug_en, c.description_en,
              c.name_uz, c.slug_uz, c.description_uz,
              s.locale, s.name_origin, s.description_origin,
              s.status, s.last_error, s.updated_at AS translation_updated_at
       FROM categories c
       LEFT JOIN category_translation_state s ON s.category_id = c.id
       WHERE c.id = $1
       ORDER BY s.locale ASC;`,
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

  async hasArticleReference(id) {
    return this.db.executeQuery(
      `SELECT EXISTS (
         SELECT 1 FROM articles
         WHERE category_id = $1
           AND deleted_at IS NULL
       ) AS exists;`,
      [id]
    );
  }

  async hasChildTopics(id) {
    return this.db.executeQuery(
      `SELECT EXISTS (
         SELECT 1 FROM topics
         WHERE category_id = $1
       ) AS exists;`,
      [id]
    );
  }
}

module.exports = CategoryQuery;
