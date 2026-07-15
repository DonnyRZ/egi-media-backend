const collection = "youtube_videos";

class YoutubeCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({ id, title, description, url, created_at }) {
    return this.db.executeQuery(
      `INSERT INTO ${collection} (id, title, description, url, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, url, created_at;`,
      [id, title, description, url, created_at]
    );
  }

  async updateOne({ id, title, description, url }) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET title = $1, description = $2, url = $3
       WHERE id = $4
       RETURNING id, title, description, url, created_at;`,
      [title, description, url, id]
    );
  }

  async deleteOne(id) {
    return this.db.executeQuery(
      `DELETE FROM ${collection}
       WHERE id = $1
       RETURNING id, title, description, url, created_at;`,
      [id]
    );
  }
}

module.exports = YoutubeCommand;
