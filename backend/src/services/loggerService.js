const fs = require("fs-extra");
const path = require("path");
const moment = require("moment");

class LoggerService {
  constructor() {
    this.logDir = path.join(__dirname, "../../logs");
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    try {
      fs.ensureDirSync(this.logDir);
    } catch (error) {
      console.error("Failed to create log directory:", error);
    }
  }

  getLogFileName(prefix = "app") {
    const timestamp = moment().format("YYYY-MM-DD");
    return `${prefix}_${timestamp}.log`;
  }

  formatLogMessage(level, message, data = null) {
    const timestamp = moment().format("YYYY-MM-DD HH:mm:ss.SSS");
    let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (data) {
      if (typeof data === "object") {
        logEntry += `\n${JSON.stringify(data, null, 2)}`;
      } else {
        logEntry += `\n${data}`;
      }
    }

    return logEntry + "\n";
  }

  async writeToFile(filename, message) {
    try {
      const logPath = path.join(this.logDir, filename);
      await fs.appendFile(logPath, message);
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  async log(level, message, data = null, filename = null) {
    const logMessage = this.formatLogMessage(level, message, data);
    const logFile = filename || this.getLogFileName();

    // Write to file
    await this.writeToFile(logFile, logMessage);

    // Also log to console for immediate visibility
    console.log(logMessage.trim());
  }

  async info(message, data = null) {
    await this.log("info", message, data);
  }

  async error(message, data = null) {
    await this.log("error", message, data);
  }

  async warn(message, data = null) {
    await this.log("warn", message, data);
  }

  async debug(message, data = null) {
    await this.log("debug", message, data);
  }

  // Specialized logging methods
  async logAIRequest(prompt, currency) {
    await this.info("AI Request", {
      timestamp: new Date().toISOString(),
      currency: currency,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 500) + "...",
    });
  }

  async logAIResponse(response, success = true) {
    await this.info("AI Response", {
      timestamp: new Date().toISOString(),
      success: success,
      responseLength: response.length,
      responsePreview: response.substring(0, 1000) + "...",
    });
  }

  async logPDFProcessing(filename, pages, textLength) {
    await this.info("PDF Processing", {
      timestamp: new Date().toISOString(),
      filename: filename,
      pages: pages,
      textLength: textLength,
    });
  }

  async logCurrencyDetection(detectedCurrency, originalText) {
    await this.info("Currency Detection", {
      timestamp: new Date().toISOString(),
      detectedCurrency: detectedCurrency,
      textPreview: originalText.substring(0, 200) + "...",
    });
  }

  async logJSONParsing(originalJson, fixedJson = null, success = true) {
    await this.info("JSON Parsing", {
      timestamp: new Date().toISOString(),
      success: success,
      originalJsonLength: originalJson.length,
      originalJsonPreview: originalJson.substring(0, 500) + "...",
      fixedJson: fixedJson
        ? {
            length: fixedJson.length,
            preview: fixedJson.substring(0, 500) + "...",
          }
        : null,
    });
  }

  async logTransactionAnalysis(transactions, categories, summary) {
    await this.info("Transaction Analysis", {
      timestamp: new Date().toISOString(),
      totalTransactions: transactions.length,
      categories: Object.keys(categories),
      summary: summary,
    });
  }

  async logExportRequest(exportType, analysisData) {
    await this.info("Export Request", {
      timestamp: new Date().toISOString(),
      exportType: exportType,
      currency: analysisData.currency,
      transactionCount: analysisData.allTransactions.length,
      categoriesCount: Object.keys(analysisData.categories).length,
    });
  }

  async logError(error, context = {}) {
    await this.error("Application Error", {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context: context,
    });
  }

  // Get recent logs for debugging
  async getRecentLogs(lines = 100) {
    try {
      const logFile = this.getLogFileName();
      const logPath = path.join(this.logDir, logFile);

      if (await fs.pathExists(logPath)) {
        const content = await fs.readFile(logPath, "utf8");
        const logLines = content.split("\n").filter((line) => line.trim());
        return logLines.slice(-lines);
      }
      return [];
    } catch (error) {
      console.error("Failed to read recent logs:", error);
      return [];
    }
  }

  // Clear old log files (keep last 7 days)
  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const cutoffDate = moment().subtract(7, "days");

      for (const file of files) {
        if (file.endsWith(".log")) {
          const filePath = path.join(this.logDir, file);
          const stats = await fs.stat(filePath);
          const fileDate = moment(stats.mtime);

          if (fileDate.isBefore(cutoffDate)) {
            await fs.remove(filePath);
            console.log(`Removed old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error("Failed to cleanup old logs:", error);
    }
  }
}

module.exports = new LoggerService();
