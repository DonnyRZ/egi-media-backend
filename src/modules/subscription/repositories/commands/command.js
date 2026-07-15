const planCollection = "subscription_plans";

class SubscriptionCommand {
  constructor(db) {
    this.db = db;
  }

  async insertPlan({ id, name, description, price, duration_days, is_active }) {
    return this.db.executeQuery(
      `INSERT INTO ${planCollection} (
         id, name, description, price, duration_days, is_active, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, name, description, price::float8 AS price, duration_days, is_active, created_at, updated_at;`,
      [id, name, description, price, duration_days, is_active]
    );
  }

  async updatePlan({ id, name, description, price, duration_days, is_active }) {
    return this.db.executeQuery(
      `UPDATE ${planCollection}
       SET name = $1,
           description = $2,
           price = $3,
           duration_days = $4,
           is_active = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, description, price::float8 AS price, duration_days, is_active, created_at, updated_at;`,
      [name, description, price, duration_days, is_active, id]
    );
  }

  async deactivatePlan(id) {
    return this.db.executeQuery(
      `UPDATE ${planCollection}
       SET is_active = FALSE,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, description, price::float8 AS price, duration_days, is_active, created_at, updated_at;`,
      [id]
    );
  }

  async createSubscription({ id, user_id, subscription_plan_id, payment_reference }) {
    const results = await this.db.executeTransaction([
      {
        query: `UPDATE user_subscriptions
                SET status = 'expired'
                WHERE user_id = $1
                  AND status = 'active'
                  AND expired_at <= NOW();`,
        values: [user_id],
      },
      {
        query: `INSERT INTO user_subscriptions (
                  id, user_id, subscription_plan_id, started_at, expired_at,
                  status, payment_reference, created_at
                )
                SELECT
                  $1,
                  $2,
                  subscription_plans.id,
                  NOW(),
                  NOW() + (subscription_plans.duration_days * INTERVAL '1 day'),
                  'active',
                  $3,
                  NOW()
                FROM subscription_plans
                WHERE subscription_plans.id = $4
                  AND subscription_plans.is_active = TRUE
                RETURNING id;`,
        values: [id, user_id, payment_reference, subscription_plan_id],
      },
      {
        query: `UPDATE users
                SET role = CASE WHEN role = 'visitor' THEN 'member' ELSE role END,
                    updated_at = NOW()
                WHERE id = $1
                  AND EXISTS (
                    SELECT 1
                    FROM user_subscriptions
                    WHERE id = $2
                  );`,
        values: [user_id, id],
      },
    ]);

    return results ? results[1] : null;
  }

  async cancelSubscription(id) {
    return this.db.executeQuery(
      `UPDATE user_subscriptions
       SET status = 'cancelled',
           expired_at = LEAST(expired_at, NOW())
       WHERE id = $1
         AND status IN ('active', 'pending')
       RETURNING id;`,
      [id]
    );
  }
}

module.exports = SubscriptionCommand;
