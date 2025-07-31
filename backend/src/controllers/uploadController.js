const multer = require("multer");
const { body, validationResult } = require("express-validator");
const pdfService = require("../services/pdfService");
const aiService = require("../services/aiService");

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
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      console.log("Processing PDF:", req.file.originalname);

      // Get currency from request body or use auto-detection
      const userCurrency = req.body.currency || null;

      // Process PDF and extract text
      const pdfResult = await pdfService.processPDF(req.file);

      if (!pdfResult.success) {
        return res.status(500).json({ error: "Failed to process PDF" });
      }

      // Analyze with AI (with currency detection/selection)
      const analysis = await aiService.analyzeBankStatement(
        pdfResult.text,
        userCurrency
      );

      // Generate chart data (separate income and expense charts)
      const chartData = await aiService.generateIncomeExpenseCharts(analysis);

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
      console.error("Upload and analysis error:", error);
      res.status(500).json({
        error: "Analysis failed",
        message: error.message,
      });
    }
  }

  async uploadAndAnalyzeStreaming(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      console.log("Processing PDF with streaming:", req.file.originalname);

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

      // Send initial status
      res.write(
        `data: ${JSON.stringify({
          type: "status",
          message: "Starting PDF processing...",
        })}\n\n`
      );
      res.flush();

      // Get currency from request body or use auto-detection
      const userCurrency = req.body.currency || null;

      // Process PDF and extract text
      res.write(
        `data: ${JSON.stringify({
          type: "status",
          message: "Extracting text from PDF...",
        })}\n\n`
      );
      res.flush();

      const pdfResult = await pdfService.processPDF(req.file);

      if (!pdfResult.success) {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message:
              "Failed to process PDF. Please ensure the file is a valid PDF.",
          })}\n\n`
        );
        res.flush();
        return res.end();
      }

      res.write(
        `data: ${JSON.stringify({
          type: "status",
          message: `PDF processed successfully. Found ${pdfResult.pages} pages and extracted ${pdfResult.text.length} characters.`,
        })}\n\n`
      );
      res.flush();

      // Analyze with AI using streaming
      res.write(
        `data: ${JSON.stringify({
          type: "status",
          message: "Starting AI analysis...",
        })}\n\n`
      );
      res.flush();

      const analysis = await aiService.analyzeBankStatementStreaming(
        pdfResult.text,
        userCurrency,
        (chunk) => {
          res.write(
            `data: ${JSON.stringify({
              type: "analysis_chunk",
              content: chunk,
            })}\n\n`
          );
          res.flush();
        }
      );

      res.write(
        `data: ${JSON.stringify({
          type: "status",
          message: "Analysis completed. Generating charts...",
        })}\n\n`
      );
      res.flush();

      // Generate chart data
      const chartData = await aiService.generateIncomeExpenseCharts(analysis);

      res.write(
        `data: ${JSON.stringify({
          type: "status",
          message: "Charts generated successfully. Finalizing results...",
        })}\n\n`
      );
      res.flush();

      // Send final result
      const finalResult = {
        type: "complete",
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
      };

      res.write(`data: ${JSON.stringify(finalResult)}\n\n`);
      res.flush();
      res.end();
    } catch (error) {
      console.error("Streaming analysis error:", error);

      // Send more specific error messages
      let errorMessage = "Analysis failed. Please try again.";

      if (error.message.includes("quota")) {
        errorMessage = "API quota exceeded. Please try again later.";
      } else if (error.message.includes("rate limit")) {
        errorMessage =
          "Rate limit exceeded. Please wait a moment and try again.";
      } else if (error.message.includes("PDF")) {
        errorMessage =
          "PDF processing failed. Please ensure the file is a valid PDF.";
      } else if (error.message.includes("AI")) {
        errorMessage = "AI analysis failed. Please try again.";
      }

      res.write(
        `data: ${JSON.stringify({ type: "error", message: errorMessage })}\n\n`
      );
      res.flush();
      res.end();
    }
  }

  async uploadOnly(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      // Process PDF only (for testing)
      const pdfResult = await pdfService.processPDF(req.file);

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
      console.error("Upload error:", error);
      res.status(500).json({
        error: "Upload failed",
        message: error.message,
      });
    }
  }

  async uploadAndAnalyzeMock(req, res) {
    try {
      console.log("Processing mock streaming request");

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Cache-Control");

      // Simulate realistic streaming with delays
      const sendChunk = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        res.flush();
      };

      // Initial status
      sendChunk({ type: "status", message: "Starting PDF processing..." });
      await UploadController.delay(500);

      sendChunk({ type: "status", message: "Extracting text from PDF..." });
      await UploadController.delay(1000);

      sendChunk({
        type: "status",
        message:
          "PDF processed successfully. Found 7 pages and extracted 33006 characters.",
      });
      await UploadController.delay(800);

      sendChunk({ type: "status", message: "Starting AI analysis..." });
      await UploadController.delay(600);

      // Simulate AI thinking process
      const aiThinkingSteps = [
        "🤔 Starting AI analysis...",
        "📊 Analyzing bank statement structure...",
        "🔍 Detecting transaction patterns...",
        "💰 Categorizing income and expenses...",
        "📈 Calculating totals and summaries...",
        "🏷️ Assigning categories to transactions...",
        "📋 Validating data accuracy...",
        "⚡ Processing... (5 chunks analyzed)",
        "⚡ Processing... (10 chunks analyzed)",
        "⚡ Processing... (15 chunks analyzed)",
        "⚡ Processing... (20 chunks analyzed)",
        "✅ Analysis complete! Parsing results...",
      ];

      for (const step of aiThinkingSteps) {
        sendChunk({ type: "analysis_chunk", content: step });
        await UploadController.delay(300 + Math.random() * 200); // Random delay between 300-500ms
      }

      sendChunk({
        type: "status",
        message: "Analysis completed. Generating charts...",
      });
      await UploadController.delay(700);

      sendChunk({
        type: "status",
        message: "Charts generated successfully. Finalizing results...",
      });
      await UploadController.delay(500);

      // Mock analysis result
      const mockResult = {
        type: "complete",
        data: {
          summary: {
            totalIncome: 14349026,
            totalExpenses: 14647913,
            netAmount: -298887,
            period: "June 2025",
            accountNumber: "0760170721",
          },
          categories: {
            "Salary/Income": {
              total: 11939452.6,
              count: 1,
              transactions: [
                {
                  date: "2025-06-30",
                  description: "PAYROLL JUN 2025",
                  amount: 11939452.6,
                  type: "credit",
                },
              ],
            },
            "Food & Dining": {
              total: 55000,
              count: 2,
              transactions: [
                {
                  date: "2025-06-18",
                  description: "QR 777",
                  amount: 9500,
                  type: "debit",
                },
                {
                  date: "2025-06-18",
                  description: "QR 009",
                  amount: 21000,
                  type: "debit",
                },
              ],
            },
            Transportation: {
              total: 15400,
              count: 1,
              transactions: [
                {
                  date: "2025-06-18",
                  description: "TRSF E-BANKING DB 1806/FTFVA/WS95221",
                  amount: 15400,
                  type: "debit",
                },
              ],
            },
            Shopping: {
              total: 118000,
              count: 1,
              transactions: [
                {
                  date: "2025-06-18",
                  description: "DB INTERCHANGE Gopay-Gojek",
                  amount: 118000,
                  type: "debit",
                },
              ],
            },
            "Bills & Utilities": {
              total: 15000,
              count: 1,
              transactions: [
                {
                  date: "2025-06-20",
                  description: "BIAYA ADM",
                  amount: 15000,
                  type: "debit",
                },
              ],
            },
            Other: {
              total: 1050000,
              count: 3,
              transactions: [
                {
                  date: "2025-06-20",
                  description: "TRSF E-BANKING DB 2006/FTSCY/WS95271",
                  amount: 35000,
                  type: "debit",
                },
                {
                  date: "2025-06-21",
                  description: "SWITCHING CR DR 542",
                  amount: 500000,
                  type: "credit",
                },
                {
                  date: "2025-06-22",
                  description: "TRSF E-BANKING DB",
                  amount: 15000,
                  type: "debit",
                },
              ],
            },
          },
          allTransactions: [
            {
              date: "2025-06-18",
              description: "QR 777",
              amount: 9500,
              type: "debit",
              category: "Food & Dining",
            },
            {
              date: "2025-06-18",
              description: "QR 009",
              amount: 21000,
              type: "debit",
              category: "Food & Dining",
            },
            {
              date: "2025-06-18",
              description: "TRSF E-BANKING DB 1806/FTFVA/WS95221",
              amount: 15400,
              type: "debit",
              category: "Transportation",
            },
            {
              date: "2025-06-18",
              description: "DB INTERCHANGE Gopay-Gojek",
              amount: 118000,
              type: "debit",
              category: "Shopping",
            },
            {
              date: "2025-06-20",
              description: "TRSF E-BANKING DB 2006/FTSCY/WS95271",
              amount: 35000,
              type: "debit",
              category: "Other",
            },
            {
              date: "2025-06-20",
              description: "BI-FAST CRBIF TRANSFER DR",
              amount: 100000,
              type: "credit",
              category: "Other",
            },
            {
              date: "2025-06-20",
              description: "TRSF E-BANKING DB 2006/FTFVA/WS95271",
              amount: 847385,
              type: "debit",
              category: "Other",
            },
            {
              date: "2025-06-20",
              description: "BIAYA ADM",
              amount: 15000,
              type: "debit",
              category: "Bills & Utilities",
            },
            {
              date: "2025-06-21",
              description: "SWITCHING CR DR 542",
              amount: 500000,
              type: "credit",
              category: "Other",
            },
            {
              date: "2025-06-21",
              description: "TRSF E-BANKING DB 2106/FTSCY/WS95271",
              amount: 50000,
              type: "debit",
              category: "Other",
            },
            {
              date: "2025-06-22",
              description: "TRSF E-BANKING DB",
              amount: 15000,
              type: "debit",
              category: "Other",
            },
            {
              date: "2025-06-24",
              description: "QR 014",
              amount: 46000,
              type: "debit",
              category: "Food & Dining",
            },
            {
              date: "2025-06-25",
              description: "TRSF E-BANKING DB 2506/FTSCY/WS95271",
              amount: 200000,
              type: "debit",
              category: "Other",
            },
            {
              date: "2025-06-26",
              description: "DB INTERCHANGE Grab* A-8XUEUQ3GX2",
              amount: 45500,
              type: "debit",
              category: "Transportation",
            },
            {
              date: "2025-06-27",
              description: "BI-FAST CRBIF TRANSFER DR",
              amount: 1000000,
              type: "credit",
              category: "Other",
            },
            {
              date: "2025-06-27",
              description: "KARTU DEBIT SABAK ADVENTURE ST",
              amount: 775000,
              type: "debit",
              category: "Shopping",
            },
            {
              date: "2025-06-27",
              description: "BI-FAST CRBIF TRANSFER DR",
              amount: 170000,
              type: "credit",
              category: "Other",
            },
            {
              date: "2025-06-27",
              description: "TARIKAN ATM 27/06",
              amount: 400000,
              type: "debit",
              category: "Other",
            },
            {
              date: "2025-06-28",
              description: "QRC014",
              amount: 9000,
              type: "debit",
              category: "Food & Dining",
            },
            {
              date: "2025-06-30",
              description: "KR OTOMATIS TRF KOLEKTIF",
              amount: 11939452.6,
              type: "credit",
              category: "Salary/Income",
            },
            {
              date: "2025-06-30",
              description: "TRSF E-BANKING DB 3006/FTSCY/WS95271",
              amount: 50000,
              type: "debit",
              category: "Other",
            },
            {
              date: "2025-06-30",
              description: "TRSF E-BANKING DB 3006/FTSCY/WS95271",
              amount: 600000,
              type: "debit",
              category: "Other",
            },
          ],
          chartData: {
            expenseChart: {
              labels: [
                "Food & Dining",
                "Transportation",
                "Shopping",
                "Bills & Utilities",
                "Other",
              ],
              datasets: [
                {
                  label: "Expenses by Category",
                  data: [55000, 15400, 118000, 15000, 1050000],
                  backgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56",
                    "#4BC0C0",
                    "#9966FF",
                  ],
                  borderWidth: 2,
                },
              ],
            },
            incomeChart: {
              labels: ["Salary/Income"],
              datasets: [
                {
                  label: "Income by Category",
                  data: [11939452.6],
                  backgroundColor: ["#4CAF50"],
                  borderWidth: 2,
                },
              ],
            },
          },
          currency: "IDR",
          processingInfo: {
            pages: 7,
            fileId: "mock-2025-06-30",
            processedAt: new Date().toISOString(),
            detectedCurrency: "IDR",
          },
        },
      };

      sendChunk(mockResult);
      res.end();
    } catch (error) {
      console.error("Mock streaming error:", error);
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "Mock analysis failed",
        })}\n\n`
      );
      res.flush();
      res.end();
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

  // Helper method for delays
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Create and export a controller instance
const uploadController = new UploadController();

module.exports = uploadController;
