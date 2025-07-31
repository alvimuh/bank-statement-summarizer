const express = require("express");
const router = express.Router();
const UploadController = require("../controllers/uploadController");

// Upload and analyze PDF
router.post(
  "/analyze",
  UploadController.validateUpload(),
  UploadController.handleMulterError,
  UploadController.uploadAndAnalyze
);

// Upload only (for testing)
router.post(
  "/upload-only",
  UploadController.validateUpload(),
  UploadController.handleMulterError,
  UploadController.uploadOnly
);

module.exports = router;
