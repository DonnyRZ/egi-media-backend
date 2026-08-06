const fs = require("fs");
const path = require("path");
const config = require("../../config/global_config");

const UPLOAD_ROOT = path.resolve(__dirname, "../../../uploads");

const isConfigured = () => true;

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

/**
 * Writes a buffer under uploads/ and returns a public absolute URL.
 * @param {{ buffer: Buffer, key: string, contentType: string }} params
 * @returns {Promise<string>}
 */
const uploadObject = async ({ buffer, key }) => {
  const safeKey = String(key || "").replace(/^[/\\]+/, "").replace(/\.\./g, "");
  if (!safeKey) throw new Error("Upload key is required");

  const absolutePath = path.join(UPLOAD_ROOT, safeKey);
  ensureDir(path.dirname(absolutePath));
  await fs.promises.writeFile(absolutePath, buffer);

  const publicBase = String(
    process.env.UPLOAD_PUBLIC_BASE_URL ||
      config.get("/frontendUrl") ||
      config.get("/host") ||
      process.env.APP_HOST ||
      ""
  )
    .trim()
    .replace(/\/+$/, "");
  if (!publicBase) {
    throw new Error("UPLOAD_PUBLIC_BASE_URL, FE_URL, or APP_HOST is required for local upload URLs");
  }

  return `${publicBase}/uploads/${safeKey.replace(/\\/g, "/")}`;
};

module.exports = { uploadObject, isConfigured, UPLOAD_ROOT };
