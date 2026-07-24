const collection = "tags";
class TagCommand {
  constructor(db) { this.db = db; }
  async insertOne({ id, name, slug, created_at }) {
    return this.db.executeQuery(`INSERT INTO ${collection} (id, name, slug, created_at) VALUES ($1, $2, $3, $4) RETURNING id, name, slug, created_at;`, [id, name, slug, created_at]);
  }
  async updateOne({ id, name, slug }) {
    return this.db.executeQuery(`UPDATE ${collection} SET name = $2, slug = $3 WHERE id = $1 RETURNING id, name, slug, created_at;`, [id, name, slug]);
  }
  async deleteOne(id) {
    return this.db.executeQuery(
      `WITH clear_soft_deleted AS (
         DELETE FROM article_tags atg
         USING articles a
         WHERE atg.article_id = a.id
           AND atg.tag_id = $1
           AND a.deleted_at IS NOT NULL
       )
       DELETE FROM ${collection}
       WHERE id = $1
       RETURNING id, name, slug, created_at;`,
      [id]
    );
  }
}
module.exports = TagCommand;
