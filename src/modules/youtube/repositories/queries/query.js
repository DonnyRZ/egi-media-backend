const collection = "youtube_videos";

class YoutubeQuery {
  constructor(db) {
    this.db = db;
  }

  async findMany({ page, limit, search }) {
    const offset = (page - 1) * limit;
    const searchValue = search ? `%${search}%` : null;

    const rowsQuery = `
      SELECT id, title, description, url, created_at
      FROM ${collection}
      WHERE ($1::text IS NULL OR title ILIKE $1 OR description ILIKE $1)
      ORDER BY title ASC, id ASC
      LIMIT $2 OFFSET $3;
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM ${collection}
      WHERE ($1::text IS NULL OR title ILIKE $1 OR description ILIKE $1);
    `;

    const [rows, count] = await Promise.all([
      this.db.executeQuery(rowsQuery, [searchValue, limit, offset]),
      this.db.executeQuery(countQuery, [searchValue]),
    ]);

    return { rows, count };
  }

  async findOneById(id) {
    return this.db.executeQuery(
      `SELECT id, title, description, url, created_at
       FROM ${collection}
       WHERE id = $1
       LIMIT 1;`,
      [id]
    );
  }
}

module.exports = YoutubeQuery;
