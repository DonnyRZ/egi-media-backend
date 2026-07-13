const { ForbiddenError } = require("../helpers/errors");
const wrapper = require("../helpers/utils/wrapper");
const { ERROR } = require("../helpers/http-status/status_code");

/**
 * Middleware to verify whether the authenticated user has one of the allowed roles.
 * Accepts role names (for example, `superadmin`) and numeric role IDs for backwards compatibility.
 */
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const roleValues = [
        req.userMeta?.role,
        req.userMeta?.role_name,
        req.userMeta?.role_id,
      ].filter((value) => value !== undefined && value !== null);

      if (roleValues.length === 0) {
        return wrapper.response(
          res,
          "fail",
          { err: new ForbiddenError("Role context missing. Please re-login.") },
          "Forbidden Access",
          ERROR.FORBIDDEN
        );
      }

      const hasAllowedRole = roleValues.some((userRole) =>
        allowedRoles.some(
          (allowedRole) => String(userRole).toLowerCase() === String(allowedRole).toLowerCase()
        )
      );

      if (!hasAllowedRole) {
        return wrapper.response(
          res,
          "fail",
          { err: new ForbiddenError("You do not have permission to access this resource.") },
          "Forbidden Access",
          ERROR.FORBIDDEN
        );
      }

      next();
    } catch (error) {
      return wrapper.response(
        res,
        "fail",
        { err: error },
        "Internal Server Error",
        ERROR.INTERNAL_ERROR
      );
    }
  };
};

module.exports = verifyRole;