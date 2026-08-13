const collection = "ads";

const RETURNING_COLUMNS = `
  id, title, image_url, target_url, placement, is_active,
  clicks, impressions, created_at, updated_at
`;

class AdCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({
    id,
    title,
    image_url,
    target_url,
    placement,
    is_active,
    clicks,
    impressions,
    created_at,
    updated_at,
  }) {
    return this.db.executeQuery(
      `INSERT INTO ${collection} (
         id, title, image_url, target_url, placement, is_active,
         clicks, impressions, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${RETURNING_COLUMNS};`,
      [
        id,
        title,
        image_url,
        target_url,
        placement,
        is_active !== false,
        clicks ?? 0,
        impressions ?? 0,
        created_at,
        updated_at,
      ]
    );
  }

  async updateOne({
    id,
    title,
    image_url,
    target_url,
    is_active,
    updated_at,
  }) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET title = $1,
           image_url = $2,
           target_url = $3,
           is_active = $4,
           updated_at = $5
       WHERE id = $6
       RETURNING ${RETURNING_COLUMNS};`,
      [
        title,
        image_url,
        target_url,
        is_active !== false,
        updated_at,
        id,
      ]
    );
  }

  async deleteOne(id) {
    return this.db.executeQuery(
      `DELETE FROM ${collection}
       WHERE id = $1
       RETURNING ${RETURNING_COLUMNS};`,
      [id]
    );
  }

  async incrementClicks(id) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET clicks = clicks + 1,
           updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE
       RETURNING ${RETURNING_COLUMNS};`,
      [id]
    );
  }

  async incrementImpressions(id) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET impressions = impressions + 1,
           updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE
       RETURNING ${RETURNING_COLUMNS};`,
      [id]
    );
  }
}

module.exports = AdCommand;
