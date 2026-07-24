const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const handler = require("../modules/user_topic_subscription/handlers/api_handler");

module.exports = (server) => {
  // Public catalog for settings UI (topics grouped by assigned category_id).
  server.get("/api/v1/topics/catalog", handler.listTopicCatalog);

  // Authenticated topic subscriptions
  server.get("/api/v1/users/me/topics", verifyToken, handler.listMyTopics);
  server.post("/api/v1/users/me/topics/:id", verifyToken, handler.subscribeTopic);
  server.delete("/api/v1/users/me/topics/:id", verifyToken, handler.unsubscribeTopic);

  // Superadmin analytics — register before /subscriptions/:id routes
  server.get(
    "/api/v1/subscriptions/stats",
    verifyToken,
    verifyRoleName(["superadmin"]),
    handler.getSubscriptionStats
  );
  server.get(
    "/api/v1/subscriptions/stats/:topicId/subscribers",
    verifyToken,
    verifyRoleName(["superadmin"]),
    handler.getTopicSubscribers
  );
};
