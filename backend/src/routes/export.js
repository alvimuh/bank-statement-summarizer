const express = require("express");
const { body, validationResult } = require("express-validator");
const exportService = require("../services/exportService");

const router = express.Router();

// Export complete analysis to CSV
router.post(
  "/csv/complete",
  [body("analysisData").isObject().withMessage("Analysis data is required")],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { analysisData } = req.body;

      // Generate CSV content
      const csvContent = await exportService.generateCSV(analysisData);
      const filename = exportService.generateFilename(
        "complete",
        analysisData.currency
      );

      // Set headers for CSV download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.send(csvContent);
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({
        error: "Export failed",
        message: error.message,
      });
    }
  }
);

// Export only transactions to CSV
router.post(
  "/csv/transactions",
  [body("analysisData").isObject().withMessage("Analysis data is required")],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { analysisData } = req.body;

      // Generate transactions CSV content
      const csvContent = await exportService.generateTransactionsCSV(analysisData);
      const filename = exportService.generateFilename(
        "transactions",
        analysisData.currency
      );

      // Set headers for CSV download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.send(csvContent);
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({
        error: "Export failed",
        message: error.message,
      });
    }
  }
);

// Export summary to CSV
router.post(
  "/csv/summary",
  [body("analysisData").isObject().withMessage("Analysis data is required")],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { analysisData } = req.body;

      // Generate summary CSV content
      const csvContent = await exportService.generateSummaryCSV(analysisData);
      const filename = exportService.generateFilename(
        "summary",
        analysisData.currency
      );

      // Set headers for CSV download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.send(csvContent);
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({
        error: "Export failed",
        message: error.message,
      });
    }
  }
);

// Get export options (for frontend)
router.get("/options", (req, res) => {
  res.json({
    success: true,
    exportOptions: [
      {
        id: "complete",
        name: "Complete Analysis",
        description:
          "Full analysis with summary, categories, and all transactions",
        filename: "complete_analysis.csv",
      },
      {
        id: "transactions",
        name: "Transactions Only",
        description:
          "Just the transaction list with dates, descriptions, and amounts",
        filename: "transactions.csv",
      },
      {
        id: "summary",
        name: "Summary Only",
        description:
          "Summary and category breakdown without individual transactions",
        filename: "summary.csv",
      },
    ],
  });
});

module.exports = router;
