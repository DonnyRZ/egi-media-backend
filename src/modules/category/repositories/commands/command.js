const collection = "categories";

const TRANSLATION_COLUMNS = [
  "name_en",
  "slug_en",
  "description_en",
  "name_uz",
  "slug_uz",
  "description_uz",
];

const RETURNING_COLUMNS = `
  id, name, slug, description,
  name_en, slug_en, description_en,
  name_uz, slug_uz, description_uz,
  created_at, updated_at
`;

class CategoryCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({
    id,
    name,
    slug,
    description,
    created_at,
    updated_at,
    name_en,
    slug_en,
    description_en,
    name_uz,
    slug_uz,
    description_uz,
    translationStates,
  }) {
    const categoryQuery = `INSERT INTO ${collection} (
         id, name, slug, description, created_at, updated_at,
         name_en, slug_en, description_en,
         name_uz, slug_uz, description_uz
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING ${RETURNING_COLUMNS};`;
    const categoryValues = [
        id,
        name,
        slug,
        description,
        created_at,
        updated_at,
        name_en ?? null,
        slug_en ?? null,
        description_en ?? null,
        name_uz ?? null,
        slug_uz ?? null,
        description_uz ?? null,
      ];
    const stateValues = translationStates.flatMap((state) => [
      id,
      state.locale,
      state.name_origin,
      state.description_origin,
      state.name_source_text,
      state.description_source_text,
      state.status,
      state.last_error,
    ]);
    const statePlaceholders = translationStates.map((_, index) => {
      const start = index * 8;
      return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6}, $${start + 7}, $${start + 8})`;
    }).join(", ");
    const stateQuery = `INSERT INTO category_translation_state (
       category_id, locale, name_origin, description_origin,
       name_source_text, description_source_text, status, last_error
     ) VALUES ${statePlaceholders};`;
    const results = await this.db.executeTransaction([
      { query: categoryQuery, values: categoryValues },
      { query: stateQuery, values: stateValues },
    ]);
    return results?.[0] ?? null;
  }

  async updateOne({
    id,
    name,
    slug,
    description,
    updated_at,
    translationValues,
    updatedTranslationFields,
    translationStates,
  }) {
    const setClauses = ["name = $1", "slug = $2", "description = $3", "updated_at = $4"];
    const values = [name, slug, description, updated_at];
    let idx = 5;

    for (const col of TRANSLATION_COLUMNS) {
      if (updatedTranslationFields.includes(col)) {
        setClauses.push(`${col} = $${idx}`);
        values.push(translationValues?.[col] ?? null);
        idx++;
      }
    }

    values.push(id);

    const categoryQuery = `UPDATE ${collection}
       SET ${setClauses.join(", ")}
       WHERE id = $${idx}
       RETURNING ${RETURNING_COLUMNS};`;
    const stateValues = translationStates.flatMap((state) => [
      id,
      state.locale,
      state.name_origin,
      state.description_origin,
      state.name_source_text,
      state.description_source_text,
      state.status,
      state.last_error,
    ]);
    const statePlaceholders = translationStates.map((_, index) => {
      const start = index * 8;
      return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6}, $${start + 7}, $${start + 8})`;
    }).join(", ");
    const stateQuery = `INSERT INTO category_translation_state (
       category_id, locale, name_origin, description_origin,
       name_source_text, description_source_text, status, last_error
     ) VALUES ${statePlaceholders}
     ON CONFLICT (category_id, locale) DO UPDATE SET
       name_origin = EXCLUDED.name_origin,
       description_origin = EXCLUDED.description_origin,
       name_source_text = EXCLUDED.name_source_text,
       description_source_text = EXCLUDED.description_source_text,
       status = EXCLUDED.status,
       last_error = EXCLUDED.last_error,
       updated_at = NOW();`;
    const results = await this.db.executeTransaction([
      { query: categoryQuery, values },
      { query: stateQuery, values: stateValues },
    ]);
    return results?.[0] ?? null;
  }

  async deleteOne(id) {
    return this.db.executeQuery(
      `WITH clear_soft_deleted AS (
         UPDATE articles
         SET category_id = NULL
         WHERE category_id = $1
           AND deleted_at IS NOT NULL
       )
       DELETE FROM ${collection}
       WHERE id = $1
       RETURNING ${RETURNING_COLUMNS};`,
      [id]
    );
  }
}

module.exports = CategoryCommand;
