const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const tagHandler = require("../modules/tag/handlers/api_handler");
module.exports = (server) => {
  server.get("/api/v1/tags", tagHandler.listTags);
  server.post("/api/v1/tags", verifyToken, verifyRoleName(["author", "superadmin"]), tagHandler.createTag);
  server.put("/api/v1/tags/:id", verifyToken, verifyRoleName(["superadmin"]), tagHandler.updateTag);
  server.delete("/api/v1/tags/:id", verifyToken, verifyRoleName(["superadmin"]), tagHandler.deleteTag);
};
