const config = require("../../config/global_config");
const cookieOptions = () => ({ httpOnly: true, secure: config.get("/env") === "production", sameSite: "lax", path: "/" });
const storeCookie = (res, cookieName, token) => res.cookie(cookieName, token, { ...cookieOptions(), maxAge: 24 * 60 * 60 * 1000 });
const deleteCookie = (res, cookieName) => res.clearCookie(cookieName, cookieOptions());
module.exports = { storeCookie, deleteCookie };
