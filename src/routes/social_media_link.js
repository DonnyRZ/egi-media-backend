const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const socialMediaLinkHandler = require("../modules/social_media_link/handlers/api_handler");

module.exports = (server) => {
  server.get(
    "/api/v1/social-media-links",
    socialMediaLinkHandler.listSocialMediaLinks
  );
  server.get(
    "/api/v1/social-media-links/:id",
    socialMediaLinkHandler.getSocialMediaLink
  );
  server.post(
    "/api/v1/social-media-links",
    verifyToken,
    verifyRoleName(["superadmin"]),
    socialMediaLinkHandler.addSocialMediaLink
  );
  server.put(
    "/api/v1/social-media-links/:id",
    verifyToken,
    verifyRoleName(["superadmin"]),
    socialMediaLinkHandler.updateSocialMediaLink
  );
  server.delete(
    "/api/v1/social-media-links/:id",
    verifyToken,
    verifyRoleName(["superadmin"]),
    socialMediaLinkHandler.deleteSocialMediaLink
  );
};
