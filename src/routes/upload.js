const multer = require("multer");
const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const uploadHandler = require("../modules/upload/handlers/api_handler");
const { MAX_IMAGE_UPLOAD_BYTES, ALLOWED_IMAGE_MIME } = require("../helpers/storage/upload-policy");
const logger = require("../helpers/utils/logger");

// Bound multipart buffers for both persistent local storage and R2.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES, files: 1, fields: 0, parts: 1 },
  fileFilter: (_req, file, callback) => {
    if (!Object.hasOwn(ALLOWED_IMAGE_MIME, file.mimetype)) {
      const error = new Error("Unsupported file type. Use JPG, PNG, WEBP, GIF, AVIF, or SVG");
      error.status = 415;
      return callback(error);
    }
    callback(null, true);
  },
});

const receiveImage = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : error.status || 400;
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Image exceeds the 5 MB upload limit. Choose a smaller image."
      : error instanceof multer.MulterError ? "Upload exactly one image using the 'file' field." : error.message;
    logger.warn("Upload", "rejected", "Image upload rejected", { status, reason: error.code || "unsupported_type" });
    return res.status(status).json({ success: false, data: null, message, code: status });
  });
};

module.exports = (server) => {
  server.post(
    "/api/v1/uploads",
    verifyToken,
    verifyRoleName(["member", "author", "superadmin"]),
    receiveImage,
    uploadHandler.uploadFile
  );
};
