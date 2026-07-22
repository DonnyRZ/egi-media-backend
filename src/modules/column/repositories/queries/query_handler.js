const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getColumns = async (payload) => domain.getColumns(payload);
const getColumnById = async (payload) => domain.getColumnById(payload);
const getColumnBySlug = async (payload) => domain.getColumnBySlug(payload);
const getMyColumns = async (payload) => domain.getMyColumns(payload);
const getPendingColumns = async (payload) => domain.getPendingColumns(payload);
const getSavedColumns = async (payload) => domain.getSavedColumns(payload);
const getComments = async (payload) => domain.getComments(payload);

module.exports = {
  getColumns,
  getColumnById,
  getColumnBySlug,
  getMyColumns,
  getPendingColumns,
  getSavedColumns,
  getComments,
};
