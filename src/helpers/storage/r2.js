const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const config = require("../../config/global_config");

const r2 = config.get("/r2BucketAuth");

// Cloudflare R2 speaks the S3 API. Path-style + v4 signing is required.
let client = null;
const getClient = () => {
  if (client) return client;
  client = new S3Client({
    endpoint: r2.enpS3Client,
    credentials: {
      accessKeyId: r2.accS3User,
      secretAccessKey: r2.secS3User,
    },
    region: "auto",
    forcePathStyle: true,
  });
  return client;
};

const PLACEHOLDER_VALUES = new Set([
  "",
  "unused",
  "your_endpoint_s3",
  "your_token",
  "your_user",
  "your_secret",
  "your-bucket-name",
]);

const isUsableConfigValue = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return false;
  if (PLACEHOLDER_VALUES.has(normalized)) return false;
  if (normalized.includes("example.invalid")) return false;
  if (normalized.startsWith("your_")) return false;
  return true;
};

const isConfigured = () =>
  Boolean(
    isUsableConfigValue(r2.enpS3Client) &&
      isUsableConfigValue(r2.accS3User) &&
      isUsableConfigValue(r2.secS3User) &&
      isUsableConfigValue(r2.bucketName)
  );

/**
 * Uploads a buffer to R2 and returns its public URL.
 * @param {{ buffer: Buffer, key: string, contentType: string }} params
 * @returns {Promise<string>} public object URL
 */
const uploadObject = async ({ buffer, key, contentType }) => {
  await getClient().send(new PutObjectCommand({
      Bucket: r2.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));

  const base = r2.publicBaseUrl
    ? String(r2.publicBaseUrl).replace(/\/+$/, "")
    : `${String(r2.enpS3Client).replace(/\/+$/, "")}/${r2.bucketName}`;

  return `${base}/${key}`;
};

module.exports = { uploadObject, isConfigured };

