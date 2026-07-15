const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const newsletterHandler = require("../modules/newsletter/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/newsletters", newsletterHandler.listNewsletters);
  server.get("/api/v1/newsletters/:id", newsletterHandler.getNewsletter);
  server.post(
    "/api/v1/newsletters",
    verifyToken,
    verifyRoleName(["superadmin", "author"]),
    newsletterHandler.createNewsletter
  );
  server.put(
    "/api/v1/newsletters/:id",
    verifyToken,
    verifyRoleName(["superadmin", "author"]),
    newsletterHandler.updateNewsletter
  );
  server.delete(
    "/api/v1/newsletters/:id",
    verifyToken,
    verifyRoleName(["superadmin", "author"]),
    newsletterHandler.deleteNewsletter
  );
  server.post(
    "/api/v1/newsletters/:id/articles",
    verifyToken,
    verifyRoleName(["superadmin", "author"]),
    newsletterHandler.addArticleToNewsletter
  );
  server.delete(
    "/api/v1/newsletters/:id/articles",
    verifyToken,
    verifyRoleName(["superadmin", "author"]),
    newsletterHandler.removeArticleFromNewsletter
  );
  server.post(
    "/api/v1/newsletters/:id/subscribe",
    verifyToken,
    newsletterHandler.subscribeToNewsletter
  );
  server.delete(
    "/api/v1/newsletters/:id/subscribe",
    verifyToken,
    newsletterHandler.unsubscribeFromNewsletter
  );
};
