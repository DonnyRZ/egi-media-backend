const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  ConflictError,
  InternalServerError,
  NotFoundError,
} = require("../../../../helpers/errors");

class UserTopicSubscriptionCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async subscribeTopic({ id, user_id }) {
    const topic = await this.query.findTopicById(id);
    if (!topic.rows.length) {
      return wrapper.error(new NotFoundError("Topic not found"));
    }

    const existing = await this.query.findSubscription({ user_id, topic_id: id });
    if (existing.rows.length > 0) {
      return wrapper.error(new ConflictError("Topic is already subscribed"));
    }

    const result = await this.command.insertOne({
      user_id,
      topic_id: id,
      created_at: new Date(),
    });
    if (!result?.rows?.length) {
      return wrapper.error(new InternalServerError("Unable to subscribe to topic"));
    }
    return wrapper.data(result.rows[0]);
  }

  async unsubscribeTopic({ id, user_id }) {
    const topic = await this.query.findTopicById(id);
    if (!topic.rows.length) {
      return wrapper.error(new NotFoundError("Topic not found"));
    }

    const existing = await this.query.findSubscription({ user_id, topic_id: id });
    if (!existing.rows.length) {
      return wrapper.error(new NotFoundError("Topic subscription not found"));
    }

    const result = await this.command.deleteOne({ user_id, topic_id: id });
    if (!result?.rows?.length) {
      return wrapper.error(new InternalServerError("Unable to unsubscribe from topic"));
    }
    return wrapper.data(result.rows[0]);
  }
}

module.exports = UserTopicSubscriptionCommandDomain;
