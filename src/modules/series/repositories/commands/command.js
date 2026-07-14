const collection = "series";

class SeriesCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({ id, name, slug, description, author_id, created_at }) {
    return this.db.executeQuery(
      `INSERT INTO ${collection} (id, name, slug, description, author_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, slug, description, created_at;`,
      [id, name, slug, description, author_id, created_at]
    );
  }

  async updateOne({ id, name, slug, description }) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET name = $1, slug = $2, description = $3
       WHERE id = $4
       RETURNING id, name, slug, description, created_at;`,
      [name, slug, description, id]
    );
  }

  async deleteOne(id) {
    return this.db.executeQuery(
      `DELETE FROM ${collection}
       WHERE id = $1
       RETURNING id, name, slug, description, created_at;`,
      [id]
    );
  }
}

module.exports = SeriesCommand;
