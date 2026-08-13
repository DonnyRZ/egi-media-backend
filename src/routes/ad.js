const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const adHandler = require("../modules/ad/handlers/api_handler");

module.exports = (server) => {
  server.get(
    "/api/v1/ads/active",
    adHandler.listActiveByPlacement
  );
  server.post("/api/v1/ads/:id/click", adHandler.trackClick);
  server.post("/api/v1/ads/:id/impression", adHandler.trackImpression);

  server.get(
    "/api/v1/ads",
    verifyToken,
    verifyRoleName(["superadmin"]),
    adHandler.listAds
  );
  server.get(
    "/api/v1/ads/:id",
    verifyToken,
    verifyRoleName(["superadmin"]),
    adHandler.getAd
  );
  server.put(
    "/api/v1/ads/:id",
    verifyToken,
    verifyRoleName(["superadmin"]),
    adHandler.updateAd
  );
};
