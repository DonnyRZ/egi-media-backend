const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");
const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const register = async (payload) => domain.register(payload);
const login = async (payload) => domain.login(payload);
const refreshToken = async (payload) => domain.refreshToken(payload);
const logout = async (payload) => domain.logout(payload);
const verifyEmail = async (payload) => domain.verifyEmail(payload);
const forgotPassword = async (payload) => domain.forgotPassword(payload);
const resetPassword = async (payload) => domain.resetPassword(payload);
const changePassword = async (payload) => domain.changePassword(payload);
const googleLogin = async (payload) => domain.googleLogin(payload);
const resendVerification = async (payload) => domain.resendVerification(payload);

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  googleLogin,
  resendVerification,
};
