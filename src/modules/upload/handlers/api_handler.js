const { createHash } = require("crypto");
const wrapper = require("../../../helpers/utils/wrapper");
const { sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");
const { BadRequestError, InternalServerError } = require("../../../helpers/errors");
const r2Storage = require("../../../helpers/storage/r2");
const localStorage = require("../../../helpers/storage/local");
const { ALLOWED_IMAGE_MIME } = require("../../../helpers/storage/upload-policy");
const logger = require("../../../helpers/utils/logger");

const resolveStorage = () => (r2Storage.isConfigured() ? r2Storage : localStorage);

// POST /api/v1/uploads (multipart/form-data, field "file")
const uploadFile = async (req, res) => {
  const file = req.file;

  if (!file) {
    return sendResponse(wrapper.error(new BadRequestError("No file uploaded (field 'file')")), res);
  }

  if (!file.size) {
    return sendResponse(wrapper.error(new BadRequestError("This image is empty. Choose another file.")), res);
  }

  const ext = ALLOWED_IMAGE_MIME[file.mimetype];
  if (!ext) {
    return sendResponse(
      wrapper.error(new BadRequestError("Unsupported file type. Use JPG, PNG, WEBP, GIF, AVIF, or SVG")),
      res
    );
  }

  const storage = resolveStorage();
  const started = Date.now();

  try {
    // Identical retry payloads share a key even if the first response was lost.
    const digest = createHash("sha256").update(file.buffer).digest("hex");
    const key = `articles/${new Date().getFullYear()}/${digest}.${ext}`;
    const url = await storage.uploadObject({
      buffer: file.buffer,
      key,
      contentType: file.mimetype,
    });
    logger.info("Upload", "completed", "Image stored", {
      bytes: file.size, mime: file.mimetype, storage: storage === localStorage ? "local" : "r2", duration_ms: Date.now() - started,
    });
    return sendResponse(wrapper.data({ url }), res, SUCCESS.CREATED);
  } catch (error) {
    logger.error("Upload", "failed", "Image storage failed", {
      bytes: file.size, duration_ms: Date.now() - started, reason: error.code || error.name || "StorageError",
    });
    return sendResponse(wrapper.error(new InternalServerError("Failed to upload file")), res);
  }
};

module.exports = { uploadFile };
