const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const userHandler = require("../modules/user/handlers/api_handler");

module.exports = (server) => {
  // ─── Public Routes ──────────────────────────────────────────────────────────
  // Get followers of an author (tidak perlu login)
  server.get("/api/v1/users/:id/followers", userHandler.getFollowers);

  // ─── Authenticated Routes ───────────────────────────────────────────────────
  // Get user detail by ID (semua role yang login)
  server.get("/api/v1/users/:id", verifyToken, userHandler.getUserById);

  // Follow / Unfollow author
  server.post("/api/v1/users/:id/follow", verifyToken, userHandler.followAuthor);
  server.delete("/api/v1/users/:id/follow", verifyToken, userHandler.unfollowAuthor);

  // ─── Superadmin-Only Routes ─────────────────────────────────────────────────
  // List semua user (superadmin only)
  server.get("/api/v1/users", verifyToken, verifyRoleName(["superadmin"]), userHandler.getUsers);

  // Update user (superadmin only)
  server.patch("/api/v1/users/:id", verifyToken, verifyRoleName(["superadmin"]), userHandler.updateUser);

  // Soft delete user (superadmin only)
  server.delete("/api/v1/users/:id", verifyToken, verifyRoleName(["superadmin"]), userHandler.deleteUser);

  // Add author account (superadmin only)
  server.post("/api/v1/admin/users", verifyToken, verifyRoleName(["superadmin"]), userHandler.addAuthor);
};
