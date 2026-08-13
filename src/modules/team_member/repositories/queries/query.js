const collection = "team_members";

const SELECT_COLUMNS = `
  id, name, role, bio, photo_url, is_active, sort_order, created_at, updated_at
`;

class TeamMemberQuery {
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
          OR name ILIKE $1
          OR role ILIKE $1
          OR COALESCE(bio, '') ILIKE $1
        )
      ORDER BY sort_order ASC, name ASC, id ASC
      LIMIT $2 OFFSET $3;
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection}
      WHERE ${activeClause}
        AND (
          $1::text IS NULL
          OR name ILIKE $1
          OR role ILIKE $1
          OR COALESCE(bio, '') ILIKE $1
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

module.exports = TeamMemberQuery;
