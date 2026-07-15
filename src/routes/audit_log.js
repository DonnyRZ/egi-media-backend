const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const auditLogHandler = require("../modules/audit_log/handlers/api_handler");

module.exports = (server) => {
  server.get(
    "/api/v1/audit-logs",
    verifyToken,
    verifyRoleName(["superadmin"]),
    auditLogHandler.listAuditLogs
  );
  server.get(
    "/api/v1/audit-logs/:id",
    verifyToken,
    verifyRoleName(["superadmin"]),
    auditLogHandler.getAuditLog
  );
};
