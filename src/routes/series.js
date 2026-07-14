const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const seriesHandler = require("../modules/series/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/series", seriesHandler.listSeries);
  server.get("/api/v1/series/:id", seriesHandler.getSeries);
  server.post("/api/v1/series", verifyToken, verifyRoleName(["author", "superadmin"]), seriesHandler.createSeries);
  server.put("/api/v1/series/:id", verifyToken, verifyRoleName(["author", "superadmin"]), seriesHandler.updateSeries);
  server.delete("/api/v1/series/:id", verifyToken, verifyRoleName(["superadmin"]), seriesHandler.deleteSeries);
};
