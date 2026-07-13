const { ForbiddenError } = require("../helpers/errors");
const wrapper = require("../helpers/utils/wrapper");
const { ERROR } = require("../helpers/http-status/status_code");

/**
 * Middleware untuk verifikasi role user berdasarkan nama role (string).
 * Digunakan ketika token payload menyimpan role sebagai string (bukan role_id numeric).
 * @param {string[]} allowedRoles - Array nama role yang diizinkan, e.g. ["superadmin"]
 */
const verifyRoleName = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.userMeta || !req.userMeta.role) {
        return wrapper.response(
          res,
          "fail",
          { err: new ForbiddenError("Role context missing. Please re-login.") },
          "Forbidden Access",
          ERROR.FORBIDDEN
        );
      }

      const userRole = req.userMeta.role;

      if (!allowedRoles.includes(userRole)) {
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

module.exports = verifyRoleName;
