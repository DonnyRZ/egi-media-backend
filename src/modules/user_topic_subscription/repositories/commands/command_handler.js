const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const domain = new Domain(new DB(config.get("/postgresqlUrl")));

const subscribeTopic = (payload) => domain.subscribeTopic(payload);
const unsubscribeTopic = (payload) => domain.unsubscribeTopic(payload);

module.exports = {
  subscribeTopic,
  unsubscribeTopic,
};
