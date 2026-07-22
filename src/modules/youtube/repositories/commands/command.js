const collection = "youtube_videos";

const TRANSLATION_COLUMNS = [
  "title_en",
  "description_en",
  "title_uz",
  "description_uz",
];

const RETURNING_COLUMNS = `
  id, title, description, url, is_active,
  title_en, description_en, title_uz, description_uz,
  created_at
`;

class YoutubeCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({
    id,
    title,
    description,
    url,
    is_active,
    created_at,
    title_en,
    description_en,
    title_uz,
    description_uz,
  }) {
    return this.db.executeQuery(
      `INSERT INTO ${collection} (
         id, title, description, url, is_active, created_at,
         title_en, description_en, title_uz, description_uz
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${RETURNING_COLUMNS};`,
      [
        id,
        title,
        description,
        url,
        is_active !== false,
        created_at,
        title_en ?? null,
        description_en ?? null,
        title_uz ?? null,
        description_uz ?? null,
      ]
    );
  }

  async updateOne({
    id,
    title,
    description,
    url,
    is_active,
    translationValues,
    updatedTranslationFields,
  }) {
    const setClauses = [
      "title = $1",
      "description = $2",
      "url = $3",
      "is_active = $4",
    ];
    const values = [title, description, url, is_active !== false];
    let idx = 5;

    for (const col of TRANSLATION_COLUMNS) {
      if (updatedTranslationFields.includes(col)) {
        setClauses.push(`${col} = $${idx}`);
        values.push(translationValues?.[col] ?? null);
        idx++;
      }
    }

    values.push(id);

    return this.db.executeQuery(
      `UPDATE ${collection}
       SET ${setClauses.join(", ")}
       WHERE id = $${idx}
       RETURNING ${RETURNING_COLUMNS};`,
      values
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

module.exports = YoutubeCommand;
