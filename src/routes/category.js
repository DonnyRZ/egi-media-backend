const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const categoryHandler = require("../modules/category/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/categories", categoryHandler.listCategories);
  server.get("/api/v1/categories/:id", categoryHandler.getCategory);
  server.post("/api/v1/categories", verifyToken, verifyRoleName(["superadmin"]), categoryHandler.createCategory);
  server.put("/api/v1/categories/:id", verifyToken, verifyRoleName(["superadmin"]), categoryHandler.updateCategory);
  server.delete("/api/v1/categories/:id", verifyToken, verifyRoleName(["superadmin"]), categoryHandler.deleteCategory);
};
