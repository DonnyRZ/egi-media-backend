const TRANSLATION_COLUMNS = [
  "name_en",
  "description_en",
  "name_uz",
  "description_uz",
];

const RETURNING_COLUMNS = `
  id, name, description, frequency, is_active, created_at,
  name_en, description_en, name_uz, description_uz
`;

class NewsletterCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({
    id,
    name,
    description,
    frequency,
    is_active,
    created_at,
    name_en,
    description_en,
    name_uz,
    description_uz,
  }) {
    return this.db.executeQuery(
      `INSERT INTO newsletters (
         id, name, description, frequency, is_active, created_at,
         name_en, description_en, name_uz, description_uz
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${RETURNING_COLUMNS};`,
      [
        id,
        name,
        description,
        frequency,
        is_active,
        created_at,
        name_en ?? null,
        description_en ?? null,
        name_uz ?? null,
        description_uz ?? null,
      ]
    );
  }

  async updateOne({
    id,
    name,
    description,
    frequency,
    is_active,
    translationValues,
    updatedTranslationFields,
  }) {
    const setClauses = [
      "name = $1",
      "description = $2",
      "frequency = $3",
      "is_active = $4",
    ];
    const values = [name, description, frequency, is_active];
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
      `UPDATE newsletters
       SET ${setClauses.join(", ")}
       WHERE id = $${idx}
       RETURNING ${RETURNING_COLUMNS};`,
      values
    );
  }

  async deleteNewsletterCascade(id) {
    const queries = [
      {
        query: `DELETE FROM newsletter_subscribers WHERE newsletter_id = $1;`,
        values: [id],
      },
      {
        query: `DELETE FROM newsletter_articles WHERE newsletter_id = $1;`,
        values: [id],
      },
      {
        query: `DELETE FROM newsletters WHERE id = $1 RETURNING ${RETURNING_COLUMNS};`,
        values: [id],
      },
    ];
    return this.db.executeTransaction(queries);
  }

  async insertNewsletterArticle({ newsletter_id, article_id, display_order }) {
    return this.db.executeQuery(
      `INSERT INTO newsletter_articles (newsletter_id, article_id, display_order)
       VALUES ($1, $2, $3)
       RETURNING newsletter_id, article_id, display_order;`,
      [newsletter_id, article_id, display_order]
    );
  }

  async deleteNewsletterArticle({ newsletter_id, article_id }) {
    return this.db.executeQuery(
      `DELETE FROM newsletter_articles
       WHERE newsletter_id = $1 AND article_id = $2
       RETURNING newsletter_id, article_id;`,
      [newsletter_id, article_id]
    );
  }

  async insertSubscriber({ newsletter_id, user_id, subscribed_at }) {
    return this.db.executeQuery(
      `INSERT INTO newsletter_subscribers (newsletter_id, user_id, subscribed_at)
       VALUES ($1, $2, $3)
       RETURNING newsletter_id, user_id, subscribed_at;`,
      [newsletter_id, user_id, subscribed_at]
    );
  }

  async deleteSubscriber({ newsletter_id, user_id }) {
    return this.db.executeQuery(
      `DELETE FROM newsletter_subscribers
       WHERE newsletter_id = $1 AND user_id = $2
       RETURNING newsletter_id, user_id;`,
      [newsletter_id, user_id]
    );
  }
}

module.exports = NewsletterCommand;
