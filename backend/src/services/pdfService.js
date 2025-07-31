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
        console.log(
          "PDF text extraction yielded minimal text, attempting OCR..."
        );

        try {
          // Try OCR as fallback
          const ocrText = await this.performOCR(file.buffer);

          if (ocrText && ocrText.trim().length > 10) {
            return {
              success: true,
              text: ocrText,
              pages: pdfData.numpages,
              fileId: fileId,
              method: "ocr",
            };
          }
        } catch (ocrError) {
          console.error("OCR processing failed:", ocrError);
          // Continue with the original text even if OCR fails
        }
      }

      return {
        success: true,
        text: pdfData.text,
        pages: pdfData.numpages,
        fileId: fileId,
        method: "pdf-parse",
      };
    } catch (error) {
      console.error("PDF processing error:", error);

      // Try OCR as last resort
      try {
        console.log("Attempting OCR as fallback...");
        const ocrText = await this.performOCR(file.buffer);

        if (ocrText && ocrText.trim().length > 10) {
          return {
            success: true,
            text: ocrText,
            pages: 1, // Default to 1 page if we can't determine
            fileId: uuidv4(),
            method: "ocr-fallback",
          };
        }
      } catch (ocrError) {
        console.error("OCR fallback also failed:", ocrError);
      }

      return {
        success: false,
        error: `PDF processing failed: ${error.message}`,
      };
    }
  }

  async performOCR(buffer) {
    try {
      console.log("Starting OCR processing...");

      // Create a worker with proper error handling
      const worker = await Tesseract.createWorker({
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Initialize worker
      await worker.loadLanguage("eng");
      await worker.initialize("eng");

      // Recognize text with timeout
      const result = await Promise.race([
        worker.recognize(buffer),
        new Promise(
          (_, reject) =>
            setTimeout(() => reject(new Error("OCR timeout")), 60000) // 60 second timeout
        ),
      ]);

      // Terminate worker
      await worker.terminate();

      console.log("OCR completed successfully");
      return result.data.text;
    } catch (error) {
      console.error("OCR processing failed:", error);

      // Return a more specific error message
      if (error.message.includes("timeout")) {
        throw new Error(
          "OCR processing timed out. Please try with a smaller file or clearer image."
        );
      } else if (error.message.includes("read image")) {
        throw new Error(
          "Unable to read image from PDF. The file might be corrupted or in an unsupported format."
        );
      } else {
        throw new Error(`OCR failed: ${error.message}`);
      }
    }
  }
}

module.exports = new PDFService();
