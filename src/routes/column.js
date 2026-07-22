const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const columnHandler = require("../modules/column/handlers/api_handler");

const writerRoles = ["member", "author", "superadmin"];

module.exports = (server) => {
  // Public
  server.get("/api/v1/columns", columnHandler.getColumns);
  server.get("/api/v1/columns/slug/:slug", columnHandler.getColumnBySlug);

  // Authenticated list routes (before /:id)
  server.get("/api/v1/columns/me", verifyToken, verifyRoleName(writerRoles), columnHandler.getMyColumns);
  server.get(
    "/api/v1/columns/me/:id",
    verifyToken,
    verifyRoleName(writerRoles),
    columnHandler.getMyColumnById
  );
  server.get(
    "/api/v1/columns/pending",
    verifyToken,
    verifyRoleName(["superadmin"]),
    columnHandler.getPendingColumns
  );
  server.get("/api/v1/columns/saved", verifyToken, columnHandler.getSavedColumns);

  // Detail
  server.get("/api/v1/columns/:id", columnHandler.getColumnById);

  // Engagement (public view/share)
  server.post("/api/v1/columns/:id/view", columnHandler.recordColumnView);
  server.post("/api/v1/columns/:id/share", columnHandler.shareColumn);
  server.post("/api/v1/columns/:id/save", verifyToken, columnHandler.saveColumn);
  server.delete("/api/v1/columns/:id/save", verifyToken, columnHandler.unsaveColumn);

  // Comments
  server.get("/api/v1/columns/:id/comments", columnHandler.getComments);
  server.post(
    "/api/v1/columns/:id/comments",
    verifyToken,
    columnHandler.createComment
  );
  server.delete(
    "/api/v1/columns/:id/comments/:commentId",
    verifyToken,
    columnHandler.deleteComment
  );

  // CRUD + approval workflow
  server.post(
    "/api/v1/columns",
    verifyToken,
    verifyRoleName(writerRoles),
    columnHandler.createColumn
  );
  server.put(
    "/api/v1/columns/:id",
    verifyToken,
    verifyRoleName(writerRoles),
    columnHandler.updateColumn
  );
  server.delete(
    "/api/v1/columns/:id",
    verifyToken,
    verifyRoleName(writerRoles),
    columnHandler.deleteColumn
  );
  server.post(
    "/api/v1/columns/:id/submit",
    verifyToken,
    verifyRoleName(writerRoles),
    columnHandler.submitColumn
  );
  server.post(
    "/api/v1/columns/:id/approve",
    verifyToken,
    verifyRoleName(["superadmin"]),
    columnHandler.approveColumn
  );
  server.post(
    "/api/v1/columns/:id/reject",
    verifyToken,
    verifyRoleName(["superadmin"]),
    columnHandler.rejectColumn
  );
};
