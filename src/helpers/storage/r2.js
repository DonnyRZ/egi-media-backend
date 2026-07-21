const AWS = require("aws-sdk");
const config = require("../../config/global_config");

const r2 = config.get("/r2BucketAuth");

// Cloudflare R2 speaks the S3 API. Path-style + v4 signing is required.
let client = null;
const getClient = () => {
  if (client) return client;
  client = new AWS.S3({
    endpoint: r2.enpS3Client,
    accessKeyId: r2.accS3User,
    secretAccessKey: r2.secS3User,
    region: "auto",
    signatureVersion: "v4",
    s3ForcePathStyle: true,
  });
  return client;
};

const isConfigured = () =>
  Boolean(r2.enpS3Client && r2.accS3User && r2.secS3User && r2.bucketName);

/**
 * Uploads a buffer to R2 and returns its public URL.
 * @param {{ buffer: Buffer, key: string, contentType: string }} params
 * @returns {Promise<string>} public object URL
 */
const uploadObject = async ({ buffer, key, contentType }) => {
  await getClient()
    .putObject({
      Bucket: r2.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
    .promise();

  const base = r2.publicBaseUrl
    ? String(r2.publicBaseUrl).replace(/\/+$/, "")
    : `${String(r2.enpS3Client).replace(/\/+$/, "")}/${r2.bucketName}`;

  return `${base}/${key}`;
};

module.exports = { uploadObject, isConfigured };
