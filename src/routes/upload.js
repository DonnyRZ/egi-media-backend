const multer = require("multer");
const verifyToken = require("../middlewares/verifyToken");
const verifyRoleName = require("../middlewares/verifyRoleName");
const uploadHandler = require("../modules/upload/handlers/api_handler");

// Buffer uploads in memory then stream to R2. 5 MB cap.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = (server) => {
  server.post(
    "/api/v1/uploads",
    verifyToken,
    verifyRoleName(["member", "author", "superadmin"]),
    upload.single("file"),
    uploadHandler.uploadFile
  );
};
