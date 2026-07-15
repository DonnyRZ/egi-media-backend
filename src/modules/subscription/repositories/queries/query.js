const planCollection = "subscription_plans";

const subscriptionFields = `
  us.id,
  us.user_id,
  us.subscription_plan_id,
  us.started_at,
  us.expired_at,
  us.status,
  us.payment_reference,
  us.created_at,
  sp.id AS plan_id,
  sp.name AS plan_name,
  sp.description AS plan_description,
  sp.price::float8 AS plan_price,
  sp.duration_days AS plan_duration_days,
  sp.is_active AS plan_is_active,
  sp.created_at AS plan_created_at,
  sp.updated_at AS plan_updated_at
`;

class SubscriptionQuery {
  constructor(db) {
    this.db = db;
  }

  async findActivePlans() {
    return this.db.executeQuery(
      `SELECT id, name, description, price::float8 AS price, duration_days, is_active, created_at, updated_at
       FROM ${planCollection}
       WHERE is_active = TRUE
       ORDER BY price ASC, name ASC;`
    );
  }

  async findPlanById(id) {
    return this.db.executeQuery(
      `SELECT id, name, description, price::float8 AS price, duration_days, is_active, created_at, updated_at
       FROM ${planCollection}
       WHERE id = $1
       LIMIT 1;`,
      [id]
    );
  }

  async findActivePlanById(id) {
    return this.db.executeQuery(
      `SELECT id, name, description, price::float8 AS price, duration_days, is_active, created_at, updated_at
       FROM ${planCollection}
       WHERE id = $1
         AND is_active = TRUE
       LIMIT 1;`,
      [id]
    );
  }

  async findPlanByName(name) {
    return this.db.executeQuery(
      `SELECT id
       FROM ${planCollection}
       WHERE LOWER(name) = LOWER($1)
       LIMIT 1;`,
      [name]
    );
  }

  async findSubscriptionHistory({ user_id, page, limit }) {
    const offset = (page - 1) * limit;
    const rowsQuery = `
      SELECT ${subscriptionFields}
      FROM user_subscriptions us
      INNER JOIN subscription_plans sp ON sp.id = us.subscription_plan_id
      WHERE us.user_id = $1
      ORDER BY us.created_at DESC, us.id DESC
      LIMIT $2 OFFSET $3;
    `;
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM user_subscriptions
      WHERE user_id = $1;
    `;

    const [rows, count] = await Promise.all([
      this.db.executeQuery(rowsQuery, [user_id, limit, offset]),
      this.db.executeQuery(countQuery, [user_id]),
    ]);
    return { rows, count };
  }

  async findCurrentActiveSubscription(user_id) {
    return this.db.executeQuery(
      `SELECT id
       FROM user_subscriptions
       WHERE user_id = $1
         AND status = 'active'
         AND expired_at > NOW()
       LIMIT 1;`,
      [user_id]
    );
  }

  async findActiveSubscriptionDetail(user_id) {
    return this.db.executeQuery(
      `SELECT ${subscriptionFields}
       FROM user_subscriptions us
       INNER JOIN subscription_plans sp ON sp.id = us.subscription_plan_id
       WHERE us.user_id = $1
         AND us.status = 'active'
         AND us.expired_at > NOW()
       ORDER BY us.started_at DESC, us.id DESC
       LIMIT 1;`,
      [user_id]
    );
  }

  async findSubscriptionDetailById(id) {
    return this.db.executeQuery(
      `SELECT ${subscriptionFields}
       FROM user_subscriptions us
       INNER JOIN subscription_plans sp ON sp.id = us.subscription_plan_id
       WHERE us.id = $1
       LIMIT 1;`,
      [id]
    );
  }

  async findSubscriptionOwnershipById(id) {
    return this.db.executeQuery(
      `SELECT id, user_id, status, expired_at
       FROM user_subscriptions
       WHERE id = $1
       LIMIT 1;`,
      [id]
    );
  }
}

module.exports = SubscriptionQuery;
