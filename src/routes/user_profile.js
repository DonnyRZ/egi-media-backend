const verifyToken = require("../middlewares/verifyToken");
const userProfileHandler = require("../modules/user_profile/handlers/api_handler");

module.exports = (server) => {
    server.get("/api/v1/users/me/profile", verifyToken, userProfileHandler.getUserProfile);
    server.put("/api/v1/users/me/profile", verifyToken, userProfileHandler.updateUserProfile);
};
