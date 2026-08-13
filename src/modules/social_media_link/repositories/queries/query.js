const collection = "social_media_links";

const SELECT_COLUMNS = `
  id, platform_name, url, icon_name, is_active, sort_order, created_at, updated_at
`;

class SocialMediaLinkQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit, search, active }) {
    const offset = (page - 1) * limit;
    const searchValue = search ? `%${search}%` : null;

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
          OR platform_name ILIKE $1
          OR url ILIKE $1
          OR icon_name ILIKE $1
        )
      ORDER BY sort_order ASC, platform_name ASC, id ASC
      LIMIT $2 OFFSET $3;
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection}
      WHERE ${activeClause}
        AND (
          $1::text IS NULL
          OR platform_name ILIKE $1
          OR url ILIKE $1
          OR icon_name ILIKE $1
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

module.exports = SocialMediaLinkQuery;
