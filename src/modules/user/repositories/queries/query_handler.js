const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getUsers = async (payload) => domain.getUsers(payload);
const getUserById = async (payload) => domain.getUserById(payload);
const getFollowers = async (payload) => domain.getFollowers(payload);

module.exports = {
  getUsers,
  getUserById,
  getFollowers,
};
