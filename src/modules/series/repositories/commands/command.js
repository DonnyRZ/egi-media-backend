const collection = "series";

const TRANSLATION_COLUMNS = [
  "name_en",
  "slug_en",
  "description_en",
  "name_uz",
  "slug_uz",
  "description_uz",
];

const RETURNING_COLUMNS = `
  id, name, slug, description, image,
  name_en, slug_en, description_en,
  name_uz, slug_uz, description_uz,
  created_at
`;

class SeriesCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({
    id,
    name,
    slug,
    description,
    image,
    author_id,
    created_at,
    name_en,
    slug_en,
    description_en,
    name_uz,
    slug_uz,
    description_uz,
  }) {
    return this.db.executeQuery(
      `INSERT INTO ${collection} (
         id, name, slug, description, image, author_id, created_at,
         name_en, slug_en, description_en,
         name_uz, slug_uz, description_uz
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING ${RETURNING_COLUMNS};`,
      [
        id,
        name,
        slug,
        description,
        image ?? null,
        author_id,
        created_at,
        name_en ?? null,
        slug_en ?? null,
        description_en ?? null,
        name_uz ?? null,
        slug_uz ?? null,
        description_uz ?? null,
      ]
    );
  }

  async updateOne({
    id,
    name,
    slug,
    description,
    image,
    translationValues,
    updatedTranslationFields,
  }) {
    const setClauses = ["name = $1", "slug = $2", "description = $3", "image = $4"];
    const values = [name, slug, description, image ?? null];
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

module.exports = SeriesCommand;
