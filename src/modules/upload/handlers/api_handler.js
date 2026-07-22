const { v4: uuidv4 } = require("uuid");
const wrapper = require("../../../helpers/utils/wrapper");
const { sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");
const { BadRequestError, InternalServerError } = require("../../../helpers/errors");
const storage = require("../../../helpers/storage/r2");

const ALLOWED_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

// POST /api/v1/uploads (multipart/form-data, field "file")
const uploadFile = async (req, res) => {
  const file = req.file;

  if (!file) {
    return sendResponse(wrapper.error(new BadRequestError("No file uploaded (field 'file')")), res);
  }

  const ext = ALLOWED_MIME[file.mimetype];
  if (!ext) {
    return sendResponse(
      wrapper.error(new BadRequestError("Unsupported file type. Use JPG, PNG, WEBP, GIF, AVIF, or SVG")),
      res
    );
  }

  if (!storage.isConfigured()) {
    return sendResponse(
      wrapper.error(new InternalServerError("Object storage is not configured (R2)")),
      res
    );
  }

  try {
    const key = `articles/${new Date().getFullYear()}/${uuidv4()}.${ext}`;
    const url = await storage.uploadObject({
      buffer: file.buffer,
      key,
      contentType: file.mimetype,
    });
    return sendResponse(wrapper.data({ url }), res, SUCCESS.CREATED);
  } catch (error) {
    return sendResponse(wrapper.error(new InternalServerError("Failed to upload file")), res);
  }
};

module.exports = { uploadFile };
