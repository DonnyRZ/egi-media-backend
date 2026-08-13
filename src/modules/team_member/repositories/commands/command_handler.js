const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const addTeamMember = (payload) => domain.addTeamMember(payload);
const updateTeamMember = (payload) => domain.updateTeamMember(payload);
const deleteTeamMember = (payload) => domain.deleteTeamMember(payload);

module.exports = {
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
};
