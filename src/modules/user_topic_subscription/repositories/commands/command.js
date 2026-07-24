class UserTopicSubscriptionCommand {
  constructor(db) {
    this.db = db;
  }

  async insertOne({ user_id, topic_id, created_at }) {
    return this.db.executeQuery(
      `INSERT INTO user_topic_subscriptions (user_id, topic_id, created_at)
       VALUES ($1, $2, $3)
       RETURNING user_id, topic_id, created_at;`,
      [user_id, topic_id, created_at]
    );
  }

  async deleteOne({ user_id, topic_id }) {
    return this.db.executeQuery(
      `DELETE FROM user_topic_subscriptions
       WHERE user_id = $1 AND topic_id = $2
       RETURNING user_id, topic_id, created_at;`,
      [user_id, topic_id]
    );
  }
}

module.exports = UserTopicSubscriptionCommand;
