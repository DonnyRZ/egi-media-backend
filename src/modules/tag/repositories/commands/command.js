const collection = "tags";
class TagCommand {
  constructor(db) { this.db = db; }
  async insertOne({ id, name, slug, created_at }) {
    return this.db.executeQuery(`INSERT INTO ${collection} (id, name, slug, created_at) VALUES ($1, $2, $3, $4) RETURNING id, name, slug, created_at;`, [id, name, slug, created_at]);
  }
  async deleteOne(id) {
    return this.db.executeQuery(`DELETE FROM ${collection} WHERE id = $1 RETURNING id, name, slug, created_at;`, [id]);
  }
}
module.exports = TagCommand;
