const multer = require("multer");
const { body, validationResult } = require("express-validator");
const pdfService = require("../services/pdfService");
const aiService = require("../services/aiService");
const logger = require("../services/loggerService");

// Configure multer for memory storage (no disk storage for privacy)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

class UploadController {
  async uploadAndAnalyze(req, res) {
    try {
      await logger.info("Starting upload and analysis", {
        filename: req.file?.originalname,
        userCurrency: req.body.currency
      });

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await logger.warn("Validation failed", { errors: errors.array() });
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      if (!req.file) {
        await logger.error("No PDF file uploaded");
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      console.log("Processing PDF:", req.file.originalname);

      // Get currency from request body or use auto-detection
      const userCurrency = req.body.currency || null;

      // Process PDF and extract text
      const pdfResult = await pdfService.processPDF(req.file);

      if (!pdfResult.success) {
        await logger.error("PDF processing failed", { error: pdfResult.error });
        return res.status(500).json({ error: "Failed to process PDF" });
      }

      // Analyze with AI (with currency detection/selection)
      const analysis = await aiService.analyzeBankStatement(
        pdfResult.text,
        userCurrency
      );

      // Generate chart data (separate income and expense charts)
      const chartData = await aiService.generateIncomeExpenseCharts(analysis);

      await logger.info("Analysis completed successfully", {
        filename: req.file.originalname,
        currency: analysis.currency,
        transactionCount: analysis.allTransactions.length,
        categoriesCount: Object.keys(analysis.categories).length
      });

      // Return comprehensive analysis
      res.json({
        success: true,
        message: "PDF analyzed successfully",
        data: {
          summary: analysis.summary,
          categories: analysis.categories,
          allTransactions: analysis.allTransactions,
          chartData: chartData,
          currency: analysis.currency,
          processingInfo: {
            pages: pdfResult.pages,
            fileId: pdfResult.fileId,
            processedAt: new Date().toISOString(),
            detectedCurrency: analysis.currency,
          },
        },
      });
    } catch (error) {
      await logger.logError(error, {
        method: "uploadAndAnalyze",
        filename: req.file?.originalname
      });
      
      console.error("Upload and analysis error:", error);
      res.status(500).json({
        error: "Analysis failed",
        message: error.message,
      });
    }
  }

  async uploadOnly(req, res) {
    try {
      await logger.info("Starting upload-only request", {
        filename: req.file?.originalname
      });

      if (!req.file) {
        await logger.error("No PDF file uploaded for upload-only");
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      // Process PDF only (for testing)
      const pdfResult = await pdfService.processPDF(req.file);

      await logger.info("Upload-only completed", {
        filename: req.file.originalname,
        success: pdfResult.success
      });

      res.json({
        success: true,
        message: "PDF processed successfully",
        data: {
          text: pdfResult.text.substring(0, 500) + "...", // Show first 500 chars
          pages: pdfResult.pages,
          fileId: pdfResult.fileId,
        },
      });
    } catch (error) {
      await logger.logError(error, {
        method: "uploadOnly",
        filename: req.file?.originalname
      });
      
      console.error("Upload error:", error);
      res.status(500).json({
        error: "Upload failed",
        message: error.message,
      });
    }
  }

  // Validation middleware
  validateUpload() {
    return [
      upload.single("pdf"),
      body("pdf").custom((value, { req }) => {
        if (!req.file) {
          throw new Error("PDF file is required");
        }
        return true;
      }),
      // Optional currency validation
      body("currency")
        .optional()
        .isLength({ min: 3, max: 3 })
        .matches(/^[A-Z]{3}$/)
        .withMessage(
          "Currency must be a valid 3-letter currency code (e.g., USD, EUR, GBP)"
        ),
    ];
  }

  // Error handling middleware for multer
  handleMulterError(error, req, res, next) {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "File too large",
          message: "File size must be less than 10MB",
        });
      }
      return res.status(400).json({
        error: "File upload error",
        message: error.message,
      });
    }

    if (error.message === "Only PDF files are allowed") {
      return res.status(400).json({
        error: "Invalid file type",
        message: "Only PDF files are allowed",
      });
    }

    next(error);
  }
}

// Create and export a controller instance
const uploadController = new UploadController();

module.exports = uploadController;
