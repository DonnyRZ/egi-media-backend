const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const tagHandler = require("../modules/tag/handlers/api_handler");
module.exports = (server) => {
  server.get("/api/v1/tags", tagHandler.listTags);
  server.post("/api/v1/tags", verifyToken, verifyRole([2, 3]), tagHandler.createTag);
  server.delete("/api/v1/tags/:id", verifyToken, verifyRole([3]), tagHandler.deleteTag);
};
