require("dotenv").config();
const confidence = require("confidence");

const config = {
  host: process.env.APP_HOST,
  env: process.env.APP_ENV,
  port: process.env.APP_PORT,
  frontendUrl: process.env.FE_URL,
  cors: {
    origins: process.env.CORS_ORIGINS || process.env.CORS_ORIGIN,
  },
  postgresqlUrl: process.env.POSTGRESQL_URL || "postgresql://postgres:postgres@localhost:5432/sample",
  crawlApiUrl: process.env.CRAWL_API_URL || "http://127.0.0.1:5050",
  jwt: {
    accessSign: process.env.ACCESS_SIGN_OPTIONS,
    refreshSign: process.env.REFRESH_SIGN_OPTIONS,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  },
  basicAuth: {
    username: process.env.USERNAME_BASIC,
    password: process.env.PASSWORD_BASIC,
  },
  googleAuth: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    secretKey: process.env.GOOGLE_SECRET_KEY,
  },
  r2BucketAuth: {
    enpS3Client: process.env.R2_ENDPOINT_S3_CLIENT,
    userApiToken: process.env.R2_USER_API_TOKEN,
    accS3User: process.env.R2_ACCESS_S3_USER,
    secS3User: process.env.R2_SECRET_S3_USER,
    bucketName: process.env.R2_BUCKET_NAME,
    // Public base URL used to build the returned object URL (r2.dev domain or a
    // custom domain bound to the bucket). No trailing slash.
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  },
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  mailConfig: {
    // Prefer SMTP_* aliases; keep MAIL_* for backward compatibility.
    host: process.env.SMTP_HOST || process.env.MAIL_HOST,
    port: process.env.SMTP_PORT || process.env.MAIL_PORT,
    secure: process.env.SMTP_SECURE || process.env.MAIL_SECURE,
    from: process.env.SMTP_FROM || process.env.MAIL_FROM,
    user: process.env.SMTP_USER || process.env.MAIL_USER,
    pass: process.env.SMTP_PASS || process.env.MAIL_PASS,
  },
  // OpenAI-compatible Responses API for CMS article auto-translation.
  ai: {
    enabled: process.env.AI_ENABLED,
    apiKey: process.env.AI_API_KEY,
    baseUrl: process.env.AI_BASE_URL,
    model: process.env.AI_MODEL,
    timeoutMs: process.env.AI_TIMEOUT_MS,
    maxRetries: process.env.AI_MAX_RETRIES,
  },
};

const store = new confidence.Store(config);

exports.get = (key) => store.get(key);
