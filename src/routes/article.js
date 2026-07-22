const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const articleHandler = require("../modules/article/handlers/api_handler");

module.exports = (server) => {
  // ─── Public Routes ──────────────────────────────────────────────────────────
  server.get("/api/v1/articles", articleHandler.getArticles);

  // Static path segments must be registered before /:id
  server.get("/api/v1/articles/slug/:slug", articleHandler.getArticleBySlug);

  // ─── Authenticated list routes (before /:id) ────────────────────────────────
  server.get("/api/v1/articles/me", verifyToken, articleHandler.getMyArticles);
  server.get("/api/v1/articles/saved", verifyToken, articleHandler.getSavedArticles);

  // Editorial CMS: seluruh artikel (semua author & status) untuk author/superadmin.
  server.get(
    "/api/v1/articles/manage",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    articleHandler.getManageArticles
  );

  // Editorial CMS dashboard stats (superadmin = all; author = own).
  server.get(
    "/api/v1/articles/stats",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    articleHandler.getArticleStats
  );

  // Detail by ID
  server.get("/api/v1/articles/:id", articleHandler.getArticleById);

  // Public engagement
  server.post("/api/v1/articles/:id/view", articleHandler.recordArticleView);
  server.post("/api/v1/articles/:id/share", articleHandler.shareArticle);

  // Save / unsave
  server.post("/api/v1/articles/:id/save", verifyToken, articleHandler.saveArticle);
  server.delete("/api/v1/articles/:id/save", verifyToken, articleHandler.unsaveArticle);

  // ─── Author & Superadmin Routes ─────────────────────────────────────────────
  server.post(
    "/api/v1/articles",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    articleHandler.createArticle
  );

  server.put(
    "/api/v1/articles/:id",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    articleHandler.updateArticle
  );

  server.delete(
    "/api/v1/articles/:id",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    articleHandler.deleteArticle
  );

  server.patch(
    "/api/v1/articles/:id/status",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    articleHandler.changeArticleStatus
  );

  server.patch(
    "/api/v1/articles/:id/placements",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    articleHandler.updateArticlePlacements
  );
};
