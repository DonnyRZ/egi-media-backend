const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const createTopic = (payload) => domain.createTopic(payload);
const updateTopic = (payload) => domain.updateTopic(payload);
const deleteTopic = (payload) => domain.deleteTopic(payload);
const followTopic = (payload) => domain.followTopic(payload);
const unfollowTopic = (payload) => domain.unfollowTopic(payload);

module.exports = {
  createTopic,
  updateTopic,
  deleteTopic,
  followTopic,
  unfollowTopic,
};
