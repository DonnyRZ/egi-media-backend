const verifyToken = require("../middlewares/verifyToken");
const notificationHandler = require("../modules/notification/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/notifications", verifyToken, notificationHandler.getMyNotifications);
  server.patch("/api/v1/notifications/:id/read", verifyToken, notificationHandler.markAsRead);
  server.patch("/api/v1/notifications/read-all", verifyToken, notificationHandler.markAllAsRead);
};
