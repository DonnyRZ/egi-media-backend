const collection = "tags";
class TagQuery {
  constructor(db) { this.db = db; }
  async findMany({ page, limit, search }) {
    const offset = (page - 1) * limit;
    const searchValue = search ? `%${search}%` : null;
    const rowsQuery = `SELECT id, name, slug, created_at, (SELECT COUNT(*)::int FROM article_tags atg JOIN articles a ON a.id = atg.article_id WHERE atg.tag_id = ${collection}.id AND a.deleted_at IS NULL) AS article_count FROM ${collection} WHERE ($1::text IS NULL OR name ILIKE $1 OR slug ILIKE $1) ORDER BY name ASC, id ASC LIMIT $2 OFFSET $3;`;
    const countQuery = `SELECT COUNT(*)::int AS total FROM ${collection} WHERE ($1::text IS NULL OR name ILIKE $1 OR slug ILIKE $1);`;
    const [rows, count] = await Promise.all([this.db.executeQuery(rowsQuery, [searchValue, limit, offset]), this.db.executeQuery(countQuery, [searchValue])]);
    return { rows, count };
  }
  async findOneById(id) { return this.db.executeQuery(`SELECT id, name, slug, created_at FROM ${collection} WHERE id = $1 LIMIT 1;`, [id]); }
  async findOneBySlug(slug) { return this.db.executeQuery(`SELECT id, name, slug, created_at FROM ${collection} WHERE slug = $1 LIMIT 1;`, [slug]); }
  async hasArticleReference(id) {
    return this.db.executeQuery(
      `SELECT EXISTS (
         SELECT 1
         FROM article_tags atg
         INNER JOIN articles a ON a.id = atg.article_id
         WHERE atg.tag_id = $1
           AND a.deleted_at IS NULL
       ) AS exists;`,
      [id],
    );
  }
}
module.exports = TagQuery;
