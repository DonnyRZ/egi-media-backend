const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const config = require("../../config/global_config");
const logger = require("../utils/logger");

const clientId = config.get("/googleAuth/clientId");
const secretKey = config.get("/googleAuth/secretKey");
const appHost = String(config.get("/host") || "").replace(/\/$/, "");
const appPort = config.get("/port");
const feUrl = String(config.get("/frontendUrl") || "http://localhost:3000").replace(
  /\/$/,
  "",
);

const ctx = "Google-OAuth";

/**
 * Build a public API base URL for Passport's callbackURL.
 * APP_HOST should already include protocol+host+port (e.g. http://localhost:5002).
 * If a port is configured and missing from APP_HOST, append it.
 */
const resolveApiBaseUrl = () => {
  if (!appHost) {
    return `http://localhost:${appPort || 5002}`;
  }

  try {
    const url = new URL(appHost);
    if (!url.port && appPort && !["80", "443"].includes(String(appPort))) {
      const isLocal =
        url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (isLocal) {
        url.port = String(appPort);
      }
    }
    return url.origin;
  } catch {
    return appHost;
  }
};

const apiBaseUrl = resolveApiBaseUrl();
const callbackURL = `${apiBaseUrl}/api/v1/auth/google/callback`;

if (!clientId || !secretKey || clientId === "your_id" || secretKey === "your_secret") {
  logger.error(
    ctx,
    "config",
    "GOOGLE_CLIENT_ID / GOOGLE_SECRET_KEY are missing or still placeholder values",
    { hasClientId: Boolean(clientId), hasSecret: Boolean(secretKey) },
  );
}

logger.info(ctx, "config", "Google OAuth callback URL", { callbackURL });

passport.use(
  new GoogleStrategy(
    {
      clientID: clientId,
      clientSecret: secretKey,
      callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile?.emails?.[0]?.value;
        if (!email) {
          return done(new Error("Google profile did not include an email address"));
        }

        const user = {
          id: profile.id,
          name: profile.displayName || email.split("@")[0],
          email: String(email).trim().toLowerCase(),
          picture: profile.photos?.[0]?.value || null,
        };
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

const authGoogle = (req, res, next) => {
  if (!clientId || !secretKey) {
    const origin = String(req.query.origin || feUrl).replace(/\/$/, "");
    return res.redirect(`${origin}/login?error=google_config`);
  }

  const { role_id, origin } = req.query;
  passport.authenticate("google", {
    scope: ["email", "profile"],
    state: JSON.stringify({ role_id, origin }),
  })(req, res, next);
};

const authGoogleCallback = (req, res, next) => {
  let state = {};
  try {
    state = req.query.state ? JSON.parse(req.query.state) : {};
  } catch {
    state = {};
  }

  const { role_id, origin } = state;
  const fallbackOrigin = `${feUrl}/id`;
  const failureRedirect = `${String(origin || fallbackOrigin).replace(/\/$/, "")}/login?error=google`;

  passport.authenticate(
    "google",
    { session: false, failureRedirect },
    (err, user) => {
      if (err || !user) {
        logger.error(ctx, "callback", "Google authentication failed", err || {});
        return res.redirect(failureRedirect);
      }
      req.user = { ...user, role_id, origin };
      next();
    },
  )(req, res, next);
};

module.exports = { authGoogle, authGoogleCallback, callbackURL };
