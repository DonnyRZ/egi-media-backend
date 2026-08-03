const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const newsFeedHandler = require("../modules/news_feed/api_handler");

module.exports = (server) => {
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
