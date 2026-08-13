const collection = "team_members";

const RETURNING_COLUMNS = `
  id, name, role, bio, photo_url, is_active, sort_order, created_at, updated_at
`;

class TeamMemberCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({
    id,
    name,
    role,
    bio,
    photo_url,
    is_active,
    sort_order,
    created_at,
    updated_at,
  }) {
    return this.db.executeQuery(
      `INSERT INTO ${collection} (
         id, name, role, bio, photo_url, is_active, sort_order, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${RETURNING_COLUMNS};`,
      [
        id,
        name,
        role,
        bio,
        photo_url,
        is_active !== false,
        sort_order,
        created_at,
        updated_at,
      ]
    );
  }

  async updateOne({
    id,
    name,
    role,
    bio,
    photo_url,
    is_active,
    sort_order,
    updated_at,
  }) {
    return this.db.executeQuery(
      `UPDATE ${collection}
       SET name = $1,
           role = $2,
           bio = $3,
           photo_url = $4,
           is_active = $5,
           sort_order = $6,
           updated_at = $7
       WHERE id = $8
       RETURNING ${RETURNING_COLUMNS};`,
      [
        name,
        role,
        bio,
        photo_url,
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

module.exports = TeamMemberCommand;
