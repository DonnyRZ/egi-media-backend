const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const youtubeHandler = require("../modules/youtube/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/cms/youtube-videos", verifyToken, verifyRoleName(["superadmin", "author"]), youtubeHandler.listCmsVideos);
  server.get("/api/v1/cms/youtube-videos/:id", verifyToken, verifyRoleName(["superadmin"]), youtubeHandler.getCmsVideo);
  server.get("/api/v1/youtube-videos", youtubeHandler.listYoutubeVideos);
  server.get("/api/v1/youtube-videos/:id", youtubeHandler.getYoutubeVideo);
  server.post(
    "/api/v1/youtube-videos",
    verifyToken,
    verifyRoleName(["superadmin", "author"]),
    youtubeHandler.addYoutubeVideo
  );
  server.put(
    "/api/v1/youtube-videos/:id",
    verifyToken,
    verifyRoleName(["superadmin", "author"]),
    youtubeHandler.updateYoutubeVideo
  );
  server.delete(
    "/api/v1/youtube-videos/:id",
    verifyToken,
    verifyRoleName(["superadmin", "author"]),
    youtubeHandler.deleteYoutubeVideo
  );
};
