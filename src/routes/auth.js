const verifyToken = require("../middlewares/verifyToken");
const authHandler = require("../modules/auth/handlers/api_handler");
const { authGoogle, authGoogleCallback } = require("../helpers/auth/google_oauth");

module.exports = (server) => {
  // Public routes
  server.post("/api/v1/auth/register", authHandler.register);
  server.post("/api/v1/auth/login", authHandler.login);
  server.post("/api/v1/auth/refresh-token", authHandler.refreshToken);
  server.get("/api/v1/auth/verify-email", authHandler.verifyEmail);
  server.post("/api/v1/auth/resend-verification", authHandler.resendVerification);
  server.post("/api/v1/auth/forgot-password", authHandler.forgotPassword);
  server.post("/api/v1/auth/reset-password", authHandler.resetPassword);

  // Google OAuth2
  server.get("/api/v1/auth/google", authGoogle);
  server.get("/api/v1/auth/google/callback", authGoogleCallback, authHandler.googleCallback);

  // Private routes (require Bearer token)
  server.post("/api/v1/auth/logout", verifyToken, authHandler.logout);
  server.patch("/api/v1/auth/change-password", verifyToken, authHandler.changePassword);
  server.get("/api/v1/auth/me", verifyToken, authHandler.getMe);
  server.patch("/api/v1/auth/me", verifyToken, authHandler.updateMe);
};
