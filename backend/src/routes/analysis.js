const express = require("express");
const { body, validationResult } = require("express-validator");
const logger = require("../services/loggerService");

const router = express.Router();

// Get analysis statistics
router.get("/stats", (req, res) => {
  res.json({
    success: true,
    stats: {
      totalRequests: 0,
      averageProcessingTime: 0,
      successRate: 100,
    },
  });
});

// Analyze text directly
router.post("/text", [
  body("text").isString().notEmpty().withMessage("Text is required"),
  body("currency").optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { text, currency } = req.body;
    
    // This would typically call the AI service
    res.json({
      success: true,
      message: "Text analysis endpoint (placeholder)",
      data: { text: text.substring(0, 100) + "..." }
    });
  } catch (error) {
    console.error("Text analysis error:", error);
    res.status(500).json({
      error: "Analysis failed",
      message: error.message,
    });
  }
});

// Get recent logs for debugging
router.get("/logs", async (req, res) => {
  try {
    const lines = parseInt(req.query.lines) || 100;
    const logs = await logger.getRecentLogs(lines);
    
    res.json({
      success: true,
      logs: logs,
      totalLines: logs.length
    });
  } catch (error) {
    console.error("Log retrieval error:", error);
    res.status(500).json({
      error: "Failed to retrieve logs",
      message: error.message,
    });
  }
});

// Clear old log files
router.post("/logs/cleanup", async (req, res) => {
  try {
    await logger.cleanupOldLogs();
    
    res.json({
      success: true,
      message: "Log cleanup completed"
    });
  } catch (error) {
    console.error("Log cleanup error:", error);
    res.status(500).json({
      error: "Failed to cleanup logs",
      message: error.message,
    });
  }
});

module.exports = router;
