const moment = require("moment");

class ExportService {
  constructor() {}

  // Generate CSV content from analysis data
  async generateCSV(analysisData) {
    try {
      const { summary, categories, allTransactions, currency } = analysisData;

      // CSV Headers
      const headers = [
        "Date",
        "Description",
        "Category",
        "Type",
        "Amount",
        "Currency",
      ];

      // Convert transactions to CSV rows
      const rows = allTransactions.map((transaction) => [
        this.formatDate(transaction.date),
        this.escapeCSV(transaction.description),
        this.escapeCSV(transaction.category),
        transaction.type,
        transaction.amount,
        currency,
      ]);

      // Add summary information at the top
      const summaryRows = [
        ["SUMMARY"],
        ["Period", summary.period],
        ["Total Income", summary.totalIncome, currency],
        ["Total Expenses", summary.totalExpenses, currency],
        ["Net Amount", summary.netAmount, currency],
        [""], // Empty row for spacing
        ["CATEGORY BREAKDOWN"],
        ["Category", "Total Amount", "Transaction Count", "Currency"],
      ];

      // Add category breakdown
      Object.entries(categories).forEach(([category, data]) => {
        summaryRows.push([
          this.escapeCSV(category),
          data.total,
          data.count,
          currency,
        ]);
      });

      summaryRows.push([""]); // Empty row for spacing
      summaryRows.push(["TRANSACTION DETAILS"]);

      // Combine all rows
      const allRows = [summaryRows, [headers], rows].flat();

      // Convert to CSV format
      const csvContent = allRows
        .map((row) => row.map((cell) => this.escapeCSV(cell)).join(","))
        .join("\n");

      return csvContent;
    } catch (error) {
      console.error("CSV generation failed:", error);
      throw new Error("Failed to generate CSV");
    }
  }

  // Generate a simplified CSV with just transactions
  async generateTransactionsCSV(analysisData) {
    try {
      const { allTransactions, currency } = analysisData;

      // CSV Headers
      const headers = [
        "Date",
        "Description",
        "Category",
        "Type",
        "Amount",
        "Currency",
      ];

      // Convert transactions to CSV rows
      const rows = allTransactions.map((transaction) => [
        this.formatDate(transaction.date),
        this.escapeCSV(transaction.description),
        this.escapeCSV(transaction.category),
        transaction.type,
        transaction.amount,
        currency,
      ]);

      // Combine headers and rows
      const allRows = [headers, ...rows];

      // Convert to CSV format
      const csvContent = allRows
        .map((row) => row.map((cell) => this.escapeCSV(cell)).join(","))
        .join("\n");

      return csvContent;
    } catch (error) {
      console.error("CSV generation failed:", error);
      throw new Error("Failed to generate CSV");
    }
  }

  // Generate summary CSV
  async generateSummaryCSV(analysisData) {
    try {
      const { summary, categories, currency } = analysisData;

      // Summary section
      const summaryRows = [
        ["BANK STATEMENT SUMMARY"],
        ["Period", summary.period],
        ["Account Number", summary.accountNumber],
        ["Currency", currency],
        [""], // Empty row
        ["FINANCIAL SUMMARY"],
        ["Total Income", summary.totalIncome],
        ["Total Expenses", summary.totalExpenses],
        ["Net Amount", summary.netAmount],
        [""], // Empty row
        ["CATEGORY BREAKDOWN"],
        ["Category", "Total Amount", "Transaction Count", "Average Amount"],
      ];

      // Add category breakdown
      Object.entries(categories).forEach(([category, data]) => {
        const averageAmount =
          data.count > 0 ? (data.total / data.count).toFixed(2) : 0;
        summaryRows.push([
          this.escapeCSV(category),
          data.total,
          data.count,
          averageAmount,
        ]);
      });

      // Convert to CSV format
      const csvContent = summaryRows
        .map((row) => row.map((cell) => this.escapeCSV(cell)).join(","))
        .join("\n");

      return csvContent;
    } catch (error) {
      console.error("CSV generation failed:", error);
      throw new Error("Failed to generate CSV");
    }
  }

  // Helper method to escape CSV values
  escapeCSV(value) {
    if (value === null || value === undefined) {
      return '""';
    }

    const stringValue = String(value);

    // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }

    return stringValue;
  }

  // Helper method to format dates
  formatDate(dateString) {
    try {
      return moment(dateString).format("YYYY-MM-DD");
    } catch (error) {
      return dateString;
    }
  }

  // Generate filename with timestamp
  generateFilename(prefix = "bank-statement", currency = "IDR") {
    const timestamp = moment().format("YYYY-MM-DD_HH-mm-ss");
    return `${prefix}_${currency}_${timestamp}.csv`;
  }
}

module.exports = new ExportService();
