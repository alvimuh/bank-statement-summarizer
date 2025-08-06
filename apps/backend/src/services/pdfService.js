const pdf = require("pdf-parse");
const Tesseract = require("tesseract.js");
const { v4: uuidv4 } = require("uuid");

class PDFService {
  async processPDF(file) {
    try {
      const fileId = uuidv4();
      
      // Extract text directly from buffer
      const pdfData = await pdf(file.buffer);

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
      console.error('PDF processing error:', error);
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
