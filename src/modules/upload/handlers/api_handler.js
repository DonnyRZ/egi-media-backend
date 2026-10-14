const { createHash } = require("crypto");
const wrapper = require("../../../helpers/utils/wrapper");
const { sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");
const { BadRequestError, InternalServerError } = require("../../../helpers/errors");
const r2Storage = require("../../../helpers/storage/r2");
const localStorage = require("../../../helpers/storage/local");
const { ALLOWED_IMAGE_MIME } = require("../../../helpers/storage/upload-policy");
const logger = require("../../../helpers/utils/logger");
const { inspectAdImage, signImage, RATIOS } = require("../../../helpers/storage/ad-image");

const resolveStorage = () => (r2Storage.isConfigured() ? r2Storage : localStorage);

// POST /api/v1/uploads (multipart/form-data, field "file")
const uploadFile = async (req, res) => {
  const file = req.file;
  const isAd = req.query.purpose === "ad";
  let dimensions;
  if (isAd) {
    if (req.userMeta?.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Only superadmin can upload advertisements", code: 403 });
    }
    try {
      if (!Object.hasOwn(RATIOS, req.query.placement)) throw new Error("Choose a homepage advertisement placement");
      if (!file?.size) throw new Error("Choose an advertisement image");
      dimensions = inspectAdImage(file, req.query.placement);
    } catch (error) {
      return sendResponse(wrapper.error(new BadRequestError(error.message)), res);
    }
  }

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
    const key = `${isAd ? "ads" : "articles"}/${new Date().getFullYear()}/${digest}.${ext}`;
    const url = await storage.uploadObject({
      buffer: file.buffer,
      key,
      contentType: file.mimetype,
    });
    logger.info("Upload", "completed", "Image stored", {
      bytes: file.size, mime: file.mimetype, storage: storage === localStorage ? "local" : "r2", duration_ms: Date.now() - started,
    });
    return sendResponse(wrapper.data(isAd ? { url, ...dimensions, image_receipt: signImage(url, dimensions) } : { url }), res, SUCCESS.CREATED);
  } catch (error) {
    logger.error("Upload", "failed", "Image storage failed", {
      bytes: file.size, duration_ms: Date.now() - started, reason: error.code || error.name || "StorageError",
    });
    return sendResponse(wrapper.error(new InternalServerError("Failed to upload file")), res);
  }
};

module.exports = { uploadFile };
