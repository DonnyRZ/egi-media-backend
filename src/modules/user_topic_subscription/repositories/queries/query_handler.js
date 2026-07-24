const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const domain = new Domain(new DB(config.get("/postgresqlUrl")));

const listMyTopics = (payload) => domain.listMyTopics(payload);
const listTopicCatalog = (payload) => domain.listTopicCatalog(payload);
const getSubscriptionStats = () => domain.getSubscriptionStats();
const getTopicSubscribers = (payload) => domain.getTopicSubscribers(payload);

module.exports = {
  listMyTopics,
  listTopicCatalog,
  getSubscriptionStats,
  getTopicSubscribers,
};
