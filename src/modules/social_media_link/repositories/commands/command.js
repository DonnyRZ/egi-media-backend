const collection = "social_media_links";

const RETURNING_COLUMNS = `
  id, platform_name, url, icon_name, is_active, sort_order, created_at, updated_at
`;

class SocialMediaLinkCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({
    id,
    platform_name,
    url,
    icon_name,
    is_active,
    sort_order,
    created_at,
    updated_at,
  }) {
    return this.db.executeQuery(
      `INSERT INTO ${collection} (
         id, platform_name, url, icon_name, is_active, sort_order, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${RETURNING_COLUMNS};`,
      [
        id,
        platform_name,
        url,
        icon_name,
        is_active !== false,
        sort_order,
        created_at,
        updated_at,
      ]
    );
  }

  async updateOne({
    id,
    platform_name,
    url,
    icon_name,
    is_active,
    sort_order,
    updated_at,
  }) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET platform_name = $1,
           url = $2,
           icon_name = $3,
           is_active = $4,
           sort_order = $5,
           updated_at = $6
       WHERE id = $7
       RETURNING ${RETURNING_COLUMNS};`,
      [
        platform_name,
        url,
        icon_name,
        is_active !== false,
        sort_order,
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
}

module.exports = SocialMediaLinkCommand;
