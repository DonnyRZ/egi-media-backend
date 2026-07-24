const collection = "topics";

const TRANSLATION_COLUMNS = [
  "name_en",
  "slug_en",
  "description_en",
  "name_uz",
  "slug_uz",
  "description_uz",
];

const RETURNING_COLUMNS = `
  id, name, slug, description, category_id,
  name_en, slug_en, description_en,
  name_uz, slug_uz, description_uz,
  created_at, updated_at
`;

class TopicCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({
    id,
    name,
    slug,
    description,
    category_id,
    created_at,
    updated_at,
    name_en,
    slug_en,
    description_en,
    name_uz,
    slug_uz,
    description_uz,
  }) {
    return this.db.executeQuery(
      `INSERT INTO ${collection} (
         id, name, slug, description, category_id, created_at, updated_at,
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
        category_id,
        created_at,
        updated_at,
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
    category_id,
    updated_at,
    translationValues,
    updatedTranslationFields,
  }) {
    const setClauses = [
      "name = $1",
      "slug = $2",
      "description = $3",
      "category_id = $4",
      "updated_at = $5",
    ];
    const values = [name, slug, description, category_id, updated_at];
    let idx = 6;

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
      `WITH removed_subscriptions AS (
         DELETE FROM user_topic_subscriptions WHERE topic_id = $1
       ),
       clear_soft_deleted AS (
         DELETE FROM article_topics at2
         USING articles a
         WHERE at2.article_id = a.id
           AND at2.topic_id = $1
           AND a.deleted_at IS NOT NULL
       )
       DELETE FROM ${collection}
       WHERE id = $1
       RETURNING ${RETURNING_COLUMNS};`,
      [id]
    );
  }

  async createFollower({ topic_id, user_id, created_at }) {
    return this.db.executeQuery(
      `INSERT INTO user_topic_subscriptions (topic_id, user_id, created_at)
       VALUES ($1, $2, $3)
       RETURNING topic_id, user_id, created_at;`,
      [topic_id, user_id, created_at]
    );
  }

  async deleteFollower({ topic_id, user_id }) {
    return this.db.executeQuery(
      `DELETE FROM user_topic_subscriptions
       WHERE topic_id = $1 AND user_id = $2
       RETURNING topic_id, user_id, created_at;`,
      [topic_id, user_id]
    );
  }
}

module.exports = TopicCommand;
