const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const subscriptionHandler = require("../modules/subscription/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/subscription-plans", subscriptionHandler.listActivePlans);
  server.post(
    "/api/v1/subscription-plans",
    verifyToken,
    verifyRoleName(["superadmin"]),
    subscriptionHandler.createPlan
  );
  server.put(
    "/api/v1/subscription-plans/:id",
    verifyToken,
    verifyRoleName(["superadmin"]),
    subscriptionHandler.updatePlan
  );
  server.delete(
    "/api/v1/subscription-plans/:id",
    verifyToken,
    verifyRoleName(["superadmin"]),
    subscriptionHandler.deactivatePlan
  );

  server.get("/api/v1/subscriptions", verifyToken, subscriptionHandler.getSubscriptionHistory);
  server.post("/api/v1/subscriptions", verifyToken, subscriptionHandler.createSubscription);
  server.get("/api/v1/subscriptions/active", verifyToken, subscriptionHandler.getActiveSubscription);
  server.patch(
    "/api/v1/subscriptions/:id/cancel",
    verifyToken,
    subscriptionHandler.cancelSubscription
  );
};
