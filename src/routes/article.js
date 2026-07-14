const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const articleHandler = require("../modules/article/handlers/api_handler");

module.exports = (server) => {
  // ─── Public Routes ──────────────────────────────────────────────────────────
  // List semua artikel yang sudah published (tanpa login)
  server.get("/api/v1/articles", articleHandler.getArticles);

  // Detail artikel by ID (tanpa login)

  // ─── Authenticated Routes ───────────────────────────────────────────────────
  // Artikel milik author yang login (semua status)
  server.get("/api/v1/articles/me", verifyToken, articleHandler.getMyArticles);

  // Artikel yang disimpan oleh user yang login
  server.get("/api/v1/articles/saved", verifyToken, articleHandler.getSavedArticles);
  server.get("/api/v1/articles/:id", articleHandler.getArticleById);

  // Save / unsave artikel
  server.post("/api/v1/articles/:id/save", verifyToken, articleHandler.saveArticle);
  server.delete("/api/v1/articles/:id/save", verifyToken, articleHandler.unsaveArticle);

  // Catat share event
  server.post("/api/v1/articles/:id/share", verifyToken, articleHandler.shareArticle);

  // ─── Author & Superadmin Routes ─────────────────────────────────────────────
  // Buat artikel baru
  server.post(
    "/api/v1/articles",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    articleHandler.createArticle
  );

  // Update artikel
  server.put(
    "/api/v1/articles/:id",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    articleHandler.updateArticle
  );

  // Soft delete artikel
  server.delete(
    "/api/v1/articles/:id",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    articleHandler.deleteArticle
  );

  // Ubah status artikel
  server.patch(
    "/api/v1/articles/:id/status",
    verifyToken,
    verifyRoleName(["author", "superadmin"]),
    articleHandler.changeArticleStatus
  );
};
