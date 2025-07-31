const pdf = require("pdf-parse");
const Tesseract = require("tesseract.js");
const fs = require("fs-extra");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

class PDFService {
  async processPDF(file) {
    try {
      const fileId = uuidv4();
      const tempFilePath = path.join(__dirname, "../../temp", `${fileId}.pdf`);

      // Ensure temp directory exists
      await fs.ensureDir(path.dirname(tempFilePath));

      // Write buffer to temporary file
      await fs.writeFile(tempFilePath, file.buffer);

      // Extract text from PDF
      const dataBuffer = await fs.readFile(tempFilePath);
      const pdfData = await pdf(dataBuffer);

      // Clean up temporary file immediately for privacy
      await fs.remove(tempFilePath);

      // Check if we got meaningful text
      if (pdfData.text.trim().length < 50) {
        // Try OCR as fallback
        const ocrText = await this.performOCR(file.buffer);

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
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async performOCR(buffer) {
    try {
      const result = await Tesseract.recognize(buffer, "eng");

      return result.data.text;
    } catch (error) {
      console.error("OCR processing failed:", error);
      throw new Error(`OCR failed: ${error.message}`);
    }
  }
}

module.exports = new PDFService();
