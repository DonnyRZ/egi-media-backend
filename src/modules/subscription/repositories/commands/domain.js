const { randomUUID } = require("crypto");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnprocessableEntityError,
} = require("../../../../helpers/errors");

class SubscriptionCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async createPlan(payload) {
    const existing = await this.query.findPlanByName(payload.name);
    if (!existing) {
      return wrapper.error(new InternalServerError("Unable to validate subscription plan"));
    }
    if (existing.rows.length > 0) {
      return wrapper.error(new ConflictError("Subscription plan name already exists"));
    }

    const result = await this.command.insertPlan({ id: randomUUID(), ...payload });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to create subscription plan"));
    }
    return wrapper.data(result.rows[0]);
  }

  async updatePlan(payload) {
    const current = await this.query.findPlanById(payload.id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate subscription plan"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Subscription plan not found"));
    }

    const duplicate = await this.query.findPlanByName(payload.name);
    if (!duplicate) {
      return wrapper.error(new InternalServerError("Unable to validate subscription plan"));
    }
    if (duplicate.rows.length > 0 && duplicate.rows[0].id !== payload.id) {
      return wrapper.error(new ConflictError("Subscription plan name already exists"));
    }

    const result = await this.command.updatePlan(payload);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to update subscription plan"));
    }
    return wrapper.data(result.rows[0]);
  }

  async deactivatePlan({ id }) {
    const current = await this.query.findPlanById(id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate subscription plan"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Subscription plan not found"));
    }

    const result = await this.command.deactivatePlan(id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to deactivate subscription plan"));
    }
    return wrapper.data(result.rows[0]);
  }

  async createSubscription(payload) {
    const [planResult, activeResult] = await Promise.all([
      this.query.findActivePlanById(payload.subscription_plan_id),
      this.query.findCurrentActiveSubscription(payload.user_id),
    ]);

    if (!planResult || !activeResult) {
      return wrapper.error(new InternalServerError("Unable to validate subscription"));
    }
    if (planResult.rows.length === 0) {
      return wrapper.error(new UnprocessableEntityError("Subscription plan is unavailable"));
    }
    if (activeResult.rows.length > 0) {
      return wrapper.error(new UnprocessableEntityError("User already has an active subscription"));
    }

    const id = randomUUID();
    const result = await this.command.createSubscription({ id, ...payload });
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to create subscription"));
    }
    if (result.rowCount === 0) {
      return wrapper.error(new UnprocessableEntityError("Subscription plan is unavailable"));
    }

    const subscription = await this.query.findSubscriptionDetailById(id);
    if (!subscription || subscription.rows.length === 0) {
      return wrapper.error(new InternalServerError("Unable to retrieve created subscription"));
    }
    return wrapper.data(subscription.rows[0]);
  }

  async cancelSubscription({ id, user_id }) {
    const current = await this.query.findSubscriptionOwnershipById(id);
    if (!current) {
      return wrapper.error(new InternalServerError("Unable to validate subscription"));
    }
    if (current.rows.length === 0) {
      return wrapper.error(new NotFoundError("Subscription not found"));
    }
    if (current.rows[0].user_id !== user_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to cancel this subscription"));
    }

    const result = await this.command.cancelSubscription(id);
    if (!result) {
      return wrapper.error(new InternalServerError("Unable to cancel subscription"));
    }
    if (result.rowCount === 0) {
      return wrapper.error(new BadRequestError("Only active or pending subscriptions can be cancelled"));
    }
    return wrapper.data(true);
  }
}

module.exports = SubscriptionCommandDomain;
