class NewsletterCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({ id, name, description, frequency, is_active, created_at }) {
    return this.db.executeQuery(
      `INSERT INTO newsletters (id, name, description, frequency, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, frequency, is_active, created_at;`,
      [id, name, description, frequency, is_active, created_at]
    );
  }

  async updateOne({ id, name, description, frequency, is_active }) {
    return this.db.executeQuery(
      `UPDATE newsletters
       SET name = $1, description = $2, frequency = $3, is_active = $4
       WHERE id = $5
       RETURNING id, name, description, frequency, is_active, created_at;`,
      [name, description, frequency, is_active, id]
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
        query: `DELETE FROM newsletters WHERE id = $1 RETURNING id, name, description, frequency, is_active, created_at;`,
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
