const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const createColumn = async (payload) => domain.createColumn(payload);
const updateColumn = async (payload) => domain.updateColumn(payload);
const deleteColumn = async (payload) => domain.deleteColumn(payload);
const submitColumn = async (payload) => domain.submitColumn(payload);
const approveColumn = async (payload) => domain.approveColumn(payload);
const rejectColumn = async (payload) => domain.rejectColumn(payload);
const retryTranslate = async (payload) => domain.retryTranslate(payload);
const saveColumn = async (payload) => domain.saveColumn(payload);
const unsaveColumn = async (payload) => domain.unsaveColumn(payload);
const shareColumn = async (payload) => domain.shareColumn(payload);
const recordColumnView = async (payload) => domain.recordColumnView(payload);
const createComment = async (payload) => domain.createComment(payload);
const deleteComment = async (payload) => domain.deleteComment(payload);

module.exports = {
  createColumn,
  updateColumn,
  deleteColumn,
  submitColumn,
  approveColumn,
  rejectColumn,
  retryTranslate,
  saveColumn,
  unsaveColumn,
  shareColumn,
  recordColumnView,
  createComment,
  deleteComment,
};
