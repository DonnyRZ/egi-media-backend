const verifyToken = require("../middlewares/verifyToken");
const verifyRole = require("../middlewares/verifyRole");
const categoryHandler = require("../modules/category/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/categories", categoryHandler.listCategories);
  server.get("/api/v1/categories/:id", categoryHandler.getCategory);
  server.post("/api/v1/categories", verifyToken, verifyRole([3]), categoryHandler.createCategory);
  server.put("/api/v1/categories/:id", verifyToken, verifyRole([3]), categoryHandler.updateCategory);
  server.delete("/api/v1/categories/:id", verifyToken, verifyRole([3]), categoryHandler.deleteCategory);
};
