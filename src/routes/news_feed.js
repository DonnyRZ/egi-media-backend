const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const newsFeedHandler = require("../modules/news_feed/api_handler");

module.exports = (server) => {
  for (const [path,handler] of [
    ['recommendations',newsFeedHandler.getRecommendations],
    ['recommendations/:id',newsFeedHandler.getRecommendation],
    ['status',newsFeedHandler.getRadarStatus],
  ]) server.get(`/api/v1/news-feed/${path}`,verifyToken,verifyRoleName(['author','superadmin']),handler);
  server.get(
    "/api/v1/news-feed/viral",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    newsFeedHandler.getViralIssues,
  );
  server.get(
    "/api/v1/news-feed/articles",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    newsFeedHandler.getCrawledArticles,
  );
};
