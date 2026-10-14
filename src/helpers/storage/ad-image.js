const { createHmac, timingSafeEqual } = require("node:crypto");
const { imageSize } = require("image-size");
const config = require("../../config/global_config");

const RATIOS = { LEADERBOARD: 1920 / 367, IN_FEED: 16 / 9, LATEST_VIDEOS: 16 / 9 };
const FORMATS = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", avif: "image/avif" };

function validateDimensions(placement, width, height) {
  const ratio = RATIOS[placement];
  if (!ratio || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 40000000) {
    throw new Error("Invalid advertisement image dimensions or placement");
  }
  if (Math.abs(width / height / ratio - 1) > 0.005) {
    const expected = placement === "LEADERBOARD" ? "1920×367 (1920:367)" : "1280×720 (16:9)";
    throw new Error(`Image is ${width}×${height}. This slot requires ${expected}.`);
  }
}

function inspectAdImage(file, placement) {
  const result = imageSize(file.buffer);
  if (FORMATS[result.type] !== file.mimetype) throw new Error("Use a valid PNG, JPG, WebP, or AVIF advertisement image");
  const rotated = [5, 6, 7, 8].includes(result.orientation);
  const width = rotated ? result.height : result.width;
  const height = rotated ? result.width : result.height;
  validateDimensions(placement, width, height);
  return { width, height };
}

function signature(value) {
  const secret = config.get("/jwt/accessTokenSecret");
  if (!secret) throw new Error("Advertisement upload signing is not configured");
  return createHmac("sha256", secret).update(`egi-ad-image:${value}`).digest();
}

function signImage(url, dimensions) {
  const payload = Buffer.from(JSON.stringify({ url, ...dimensions })).toString("base64url");
  return `${payload}.${signature(payload).toString("base64url")}`;
}

function verifyImage(receipt, url, placement) {
  if (typeof receipt !== "string" || receipt.length > 6000) throw new Error("Upload an image before saving this advertisement");
  const [payload, supplied, extra] = receipt.split(".");
  const actual = signature(payload || "");
  const provided = Buffer.from(supplied || "", "base64url");
  if (extra || actual.length !== provided.length || !timingSafeEqual(actual, provided)) throw new Error("Invalid advertisement image receipt");
  const result = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (result.url !== url) throw new Error("Upload the selected advertisement image again");
  validateDimensions(placement, result.width, result.height);
  return { width: result.width, height: result.height };
}

module.exports = { RATIOS, validateDimensions, inspectAdImage, signImage, verifyImage };
