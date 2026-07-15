const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const createPlan = (payload) => domain.createPlan(payload);
const updatePlan = (payload) => domain.updatePlan(payload);
const deactivatePlan = (payload) => domain.deactivatePlan(payload);
const createSubscription = (payload) => domain.createSubscription(payload);
const cancelSubscription = (payload) => domain.cancelSubscription(payload);

module.exports = {
  createPlan,
  updatePlan,
  deactivatePlan,
  createSubscription,
  cancelSubscription,
};
