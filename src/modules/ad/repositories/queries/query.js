const collection = "ads";

const SELECT_COLUMNS = `
  id, title, image_url, target_url, placement, is_active,
  clicks, impressions, created_at, updated_at, image_width, image_height, image_receipt
`;

const PUBLIC_COLUMNS = `
  id, title, image_url, target_url, placement, image_width, image_height
`;

class AdQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit, search, active, placement }) {
    const offset = (page - 1) * limit;
    const searchValue = search ? `%${search}%` : null;

    let activeClause = "TRUE";
    if (active === true || active === "true") {
      activeClause = "is_active = TRUE";
    } else if (active === false || active === "false") {
      activeClause = "is_active = FALSE";
    }

    const placementValue =
      placement && placement !== "all" ? placement : null;

    const rowsQuery = `
      SELECT ${SELECT_COLUMNS}
      FROM ${collection}
      WHERE ${activeClause}
        AND (placement <> 'SIDEBAR_RECTANGLE' OR $4 = 'SIDEBAR_RECTANGLE')
        AND ($4::text IS NULL OR placement = $4)
        AND (
          $1::text IS NULL
          OR title ILIKE $1
          OR target_url ILIKE $1
          OR placement ILIKE $1
        )
      ORDER BY
        CASE placement
          WHEN 'LEADERBOARD' THEN 1
          WHEN 'HERO_BELOW' THEN 2
          WHEN 'IN_FEED' THEN 3
          WHEN 'LATEST_VIDEOS' THEN 4
          WHEN 'SIDEBAR_RECTANGLE' THEN 5
          ELSE 6
        END,
        created_at ASC
      LIMIT $2 OFFSET $3;
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection}
      WHERE ${activeClause}
        AND (placement <> 'SIDEBAR_RECTANGLE' OR $2 = 'SIDEBAR_RECTANGLE')
        AND ($2::text IS NULL OR placement = $2)
        AND (
          $1::text IS NULL
          OR title ILIKE $1
          OR target_url ILIKE $1
          OR placement ILIKE $1
        );
    `;

    const [rows, count] = await Promise.all([
      this.db.executeQuery(rowsQuery, [
        searchValue,
        limit,
        offset,
        placementValue,
      ]),
      this.db.executeQuery(countQuery, [searchValue, placementValue]),
    ]);

    return { rows, count };
  }

  async findActiveByPlacement(placement) {
    return this.db.executeQuery(
      `SELECT ${PUBLIC_COLUMNS}
       FROM ${collection}
       WHERE is_active = TRUE
         AND placement = $1
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 1;`,
      [placement]
    );
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

module.exports = AdQuery;
