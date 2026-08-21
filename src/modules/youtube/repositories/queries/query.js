const collection = "youtube_videos";

const SELECT_COLUMNS = `
  id, title, description, url, is_active, author_id, status,
  title_en, description_en, title_uz, description_uz,
  created_at
`;

class YoutubeQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit, search, active }) {
    const offset = (page - 1) * limit;
    const searchValue = search ? `%${search}%` : null;

    // active: true (default/public) | false | 'all' (CMS)
    let activeClause = "is_active = TRUE";
    if (active === "all") {
      activeClause = "TRUE";
    } else if (active === false || active === "false") {
      activeClause = "is_active = FALSE";
    }

    const rowsQuery = `
      SELECT ${SELECT_COLUMNS}
      FROM ${collection}
      WHERE ${activeClause}
        AND (
          $1::text IS NULL
          OR title ILIKE $1 OR description ILIKE $1
          OR title_en ILIKE $1 OR description_en ILIKE $1
          OR title_uz ILIKE $1 OR description_uz ILIKE $1
        )
      ORDER BY created_at DESC, title ASC, id ASC
      LIMIT $2 OFFSET $3;
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection}
      WHERE ${activeClause}
        AND (
          $1::text IS NULL
          OR title ILIKE $1 OR description ILIKE $1
          OR title_en ILIKE $1 OR description_en ILIKE $1
          OR title_uz ILIKE $1 OR description_uz ILIKE $1
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
}

module.exports = YoutubeQuery;
