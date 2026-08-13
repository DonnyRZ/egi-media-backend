const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const teamMemberHandler = require("../modules/team_member/handlers/api_handler");

module.exports = (server) => {
  server.get("/api/v1/team-members", teamMemberHandler.listTeamMembers);
  server.get("/api/v1/team-members/:id", teamMemberHandler.getTeamMember);
  server.post(
    "/api/v1/team-members",
    verifyToken,
    verifyRoleName(["superadmin"]),
    teamMemberHandler.addTeamMember
  );
  server.put(
    "/api/v1/team-members/:id",
    verifyToken,
    verifyRoleName(["superadmin"]),
    teamMemberHandler.updateTeamMember
  );
  server.delete(
    "/api/v1/team-members/:id",
    verifyToken,
    verifyRoleName(["superadmin"]),
    teamMemberHandler.deleteTeamMember
  );
};
