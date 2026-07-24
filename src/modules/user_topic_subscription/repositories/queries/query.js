const TOPIC_COLUMNS = `
  t.id, t.name, t.slug, t.description,
  t.name_en, t.slug_en, t.description_en,
  t.name_uz, t.slug_uz, t.description_uz,
  t.created_at, t.updated_at,
  t.category_id,
  c.name AS category_name,
  c.name_en AS category_name_en,
  c.name_uz AS category_name_uz,
  c.slug AS category_slug
`;

const emptyResult = () => ({ rows: [], rowCount: 0 });

class UserTopicSubscriptionQuery {
  constructor(db) {
    this.db = db;
  }

  async findTopicById(id) {
    const result = await this.db.executeQuery(
      `SELECT ${TOPIC_COLUMNS}
       FROM topics t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.id = $1
       LIMIT 1;`,
      [id]
    );
    return result || emptyResult();
  }

  async findSubscription({ user_id, topic_id }) {
    const result = await this.db.executeQuery(
      `SELECT user_id, topic_id, created_at
       FROM user_topic_subscriptions
       WHERE user_id = $1 AND topic_id = $2
       LIMIT 1;`,
      [user_id, topic_id]
    );
    return result || emptyResult();
  }

  async findSubscribedTopicsByUser(user_id) {
    const result = await this.db.executeQuery(
      `SELECT ${TOPIC_COLUMNS},
              uts.created_at AS subscribed_at
       FROM user_topic_subscriptions uts
       INNER JOIN topics t ON t.id = uts.topic_id
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE uts.user_id = $1
       ORDER BY t.name ASC, t.id ASC;`,
      [user_id]
    );
    return result || emptyResult();
  }

  async findTopicsCatalog() {
    const result = await this.db.executeQuery(
      `SELECT ${TOPIC_COLUMNS}
       FROM topics t
       LEFT JOIN categories c ON c.id = t.category_id
       ORDER BY c.name ASC NULLS LAST, t.name ASC, t.id ASC;`
    );
    return result || emptyResult();
  }

  async findSubscriptionStats() {
    const result = await this.db.executeQuery(
      `SELECT
         t.id AS topic_id,
         t.name AS topic_name,
         t.slug AS topic_slug,
         t.category_id,
         c.name AS category_name,
         c.slug AS category_slug,
         COUNT(uts.user_id)::int AS subscriber_count
       FROM topics t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN user_topic_subscriptions uts ON uts.topic_id = t.id
       GROUP BY t.id, t.name, t.slug, t.category_id, c.name, c.slug
       ORDER BY subscriber_count DESC, t.name ASC;`
    );
    return result || emptyResult();
  }

  async findTopicSubscribers(topic_id) {
    const result = await this.db.executeQuery(
      `SELECT
         u.id AS user_id,
         u.email,
         u.full_name,
         u.role,
         uts.created_at AS subscribed_at
       FROM user_topic_subscriptions uts
       INNER JOIN users u ON u.id = uts.user_id
       WHERE uts.topic_id = $1
         AND u.deleted_at IS NULL
       ORDER BY uts.created_at DESC, u.email ASC;`,
      [topic_id]
    );
    return result || emptyResult();
  }
}

module.exports = UserTopicSubscriptionQuery;
