const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const addYoutubeVideo = (payload) => domain.addYoutubeVideo(payload);
const updateYoutubeVideo = (payload) => domain.updateYoutubeVideo(payload);
const deleteYoutubeVideo = (payload) => domain.deleteYoutubeVideo(payload);

module.exports = {
  addYoutubeVideo,
  updateYoutubeVideo,
  deleteYoutubeVideo,
};
