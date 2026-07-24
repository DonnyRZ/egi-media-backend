const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const topicHandler = require("../modules/topic/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/topics", topicHandler.listTopics);
  server.get("/api/v1/topics/:id", topicHandler.getTopic);
  server.post("/api/v1/topics", verifyToken, verifyRoleName(["superadmin"]), topicHandler.createTopic);
  server.put("/api/v1/topics/:id", verifyToken, verifyRoleName(["superadmin"]), topicHandler.updateTopic);
  server.delete("/api/v1/topics/:id", verifyToken, verifyRoleName(["superadmin"]), topicHandler.deleteTopic);
  // Legacy follow aliases — same store as /users/me/topics
  server.post("/api/v1/topics/:id/follow", verifyToken, topicHandler.followTopic);
  server.delete("/api/v1/topics/:id/follow", verifyToken, topicHandler.unfollowTopic);
};
