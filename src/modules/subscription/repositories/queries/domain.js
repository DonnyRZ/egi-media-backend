const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { InternalServerError, NotFoundError } = require("../../../../helpers/errors");

const toPlan = (row) => ({
  id: row.plan_id,
  name: row.plan_name,
  description: row.plan_description,
  price: row.plan_price,
  duration_days: row.plan_duration_days,
  is_active: row.plan_is_active,
  created_at: row.plan_created_at,
  updated_at: row.plan_updated_at,
});

const toSubscription = (row) => ({
  id: row.id,
  user_id: row.user_id,
  subscription_plan_id: row.subscription_plan_id,
  started_at: row.started_at,
  expired_at: row.expired_at,
  status: row.status,
  payment_reference: row.payment_reference,
  created_at: row.created_at,
  plan: toPlan(row),
});

class SubscriptionQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  async listActivePlans() {
    const result = await this.query.findActivePlans();
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to retrieve subscription plans"));
    }
    return wrapper.data(result.rows);
  }

  async getSubscriptionHistory(payload) {
    const { rows, count } = await this.query.findSubscriptionHistory(payload);
    if (!rows || !count) {
      return wrapper.error(new InternalServerError("Unable to retrieve subscriptions"));
    }

    const total = count.rows[0]?.total || 0;
    return wrapper.paginationData(rows.rows.map(toSubscription), {
      page: payload.page,
      limit: payload.limit,
      total,
      total_pages: Math.ceil(total / payload.limit),
    });
  }

  async getActiveSubscription({ user_id }) {
    const result = await this.query.findActiveSubscriptionDetail(user_id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to retrieve active subscription"));
    }
    if (result.rows.length === 0) {
      return wrapper.error(new NotFoundError("Active subscription not found"));
    }
    return wrapper.data(toSubscription(result.rows[0]));
  }
}

module.exports = SubscriptionQueryDomain;
