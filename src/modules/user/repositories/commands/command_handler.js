const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const updateUser = async (payload) => domain.updateUser(payload);
const deleteUser = async (payload) => domain.deleteUser(payload);
const followAuthor = async (payload) => domain.followAuthor(payload);
const unfollowAuthor = async (payload) => domain.unfollowAuthor(payload);

module.exports = {
  updateUser,
  deleteUser,
  followAuthor,
  unfollowAuthor,
};
