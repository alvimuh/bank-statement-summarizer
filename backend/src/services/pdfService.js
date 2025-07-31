const pdf = require("pdf-parse");
const Tesseract = require("tesseract.js");
const fs = require("fs-extra");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const logger = require("./loggerService");

class PDFService {
  async processPDF(file) {
    try {
      await logger.info("Starting PDF processing", {
        filename: file.originalname,
        fileSize: file.size
      });

      const fileId = uuidv4();
      const tempFilePath = path.join(__dirname, "../../temp", `${fileId}.pdf`);

      // Ensure temp directory exists
      await fs.ensureDir(path.dirname(tempFilePath));

      // Write buffer to temporary file
      await fs.writeFile(tempFilePath, file.buffer);

      // Extract text from PDF
      const dataBuffer = await fs.readFile(tempFilePath);
      const pdfData = await pdf(dataBuffer);

      await logger.logPDFProcessing(
        file.originalname,
        pdfData.numpages,
        pdfData.text.length
      );

      // Clean up temporary file immediately for privacy
      await fs.remove(tempFilePath);

      // Check if we got meaningful text
      if (pdfData.text.trim().length < 50) {
        await logger.warn("PDF text extraction yielded minimal text, attempting OCR", {
          textLength: pdfData.text.length,
          textPreview: pdfData.text.substring(0, 200)
        });

        // Try OCR as fallback
        const ocrText = await this.performOCR(file.buffer);
        
        await logger.info("OCR completed", {
          ocrTextLength: ocrText.length,
          ocrTextPreview: ocrText.substring(0, 200)
        });

        return {
          success: true,
          text: ocrText,
          pages: pdfData.numpages,
          fileId: fileId,
        };
      }

      return {
        success: true,
        text: pdfData.text,
        pages: pdfData.numpages,
        fileId: fileId,
      };
    } catch (error) {
      await logger.logError(error, {
        method: "processPDF",
        filename: file.originalname,
        fileSize: file.size
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async performOCR(buffer) {
    try {
      await logger.info("Starting OCR processing");
      
      const result = await Tesseract.recognize(buffer, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            logger.debug("OCR Progress", { progress: m.progress });
          }
        },
      });

      await logger.info("OCR completed successfully", {
        textLength: result.data.text.length
      });

      return result.data.text;
    } catch (error) {
      await logger.logError(error, { method: "performOCR" });
      throw new Error(`OCR failed: ${error.message}`);
    }
  }
}

module.exports = new PDFService();
