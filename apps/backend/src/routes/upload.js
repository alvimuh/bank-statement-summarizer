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

// V2: Streaming analyze endpoint
router.post(
  "/analyze-v2",
  UploadController.validateUpload(),
  UploadController.handleMulterError,
  UploadController.uploadAndAnalyzeStreaming
);

// Mock streaming endpoint for testing
router.post("/analyze-mock", UploadController.uploadAndAnalyzeMock);

// Upload only (for testing)
router.post(
  "/upload-only",
  UploadController.validateUpload(),
  UploadController.handleMulterError,
  UploadController.uploadOnly
);

module.exports = router;
