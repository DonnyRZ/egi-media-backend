const collection = "categories";

class CategoryCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({ id, name, slug, description, created_at, updated_at }) {
    return this.db.executeQuery(
      `INSERT INTO ${collection} (id, name, slug, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, slug, description, created_at, updated_at;`,
      [id, name, slug, description, created_at, updated_at]
    );
  }

  async updateOne({ id, name, slug, description, updated_at }) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET name = $1, slug = $2, description = $3, updated_at = $4
       WHERE id = $5
       RETURNING id, name, slug, description, created_at, updated_at;`,
      [name, slug, description, updated_at, id]
    );
  }

  async deleteOne(id) {
    return this.db.executeQuery(
      `DELETE FROM ${collection}
       WHERE id = $1
       RETURNING id, name, slug, description, created_at, updated_at;`,
      [id]
    );
  }
}

module.exports = CategoryCommand;
