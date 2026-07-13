const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const topicHandler = require("../modules/topic/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/topics", topicHandler.listTopics);
  server.get("/api/v1/topics/:id", topicHandler.getTopic);
  server.post("/api/v1/topics", verifyToken, verifyRole(["superadmin"]), topicHandler.createTopic);
  server.put("/api/v1/topics/:id", verifyToken, verifyRole(["superadmin"]), topicHandler.updateTopic);
  server.delete("/api/v1/topics/:id", verifyToken, verifyRole(["superadmin"]), topicHandler.deleteTopic);
  server.post("/api/v1/topics/:id/follow", verifyToken, topicHandler.followTopic);
  server.delete("/api/v1/topics/:id/follow", verifyToken, topicHandler.unfollowTopic);
};
