const { GoogleGenerativeAI } = require("@google/generative-ai");
const moment = require("moment");
const logger = require("./loggerService");

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async analyzeBankStatement(text, userCurrency = null) {
    try {
      await logger.info("Starting AI analysis", {
        textLength: text.length,
        userCurrency: userCurrency
      });

      // First, detect currency from the PDF content
      const detectedCurrency =
        userCurrency || (await this.detectCurrency(text));

      await logger.logCurrencyDetection(detectedCurrency, text);

      const prompt = this.buildAnalysisPrompt(text, detectedCurrency);
      await logger.logAIRequest(prompt, detectedCurrency);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      await logger.logAIResponse(textResponse, true);

      const analysis = await this.parseAIResponse(textResponse);

      // Add currency information to the analysis
      analysis.currency = detectedCurrency;

      await logger.logTransactionAnalysis(
        analysis.allTransactions,
        analysis.categories,
        analysis.summary
      );

      return analysis;
    } catch (error) {
      await logger.logError(error, {
        method: "analyzeBankStatement",
        userCurrency: userCurrency,
        textLength: text.length
      });

      console.error("AI analysis failed:", error);

      // Handle specific Gemini errors
      if (
        error.message.includes("quota") ||
        error.message.includes("quota exceeded")
      ) {
        await logger.warn("Gemini quota exceeded, using fallback mode");
        console.log("Gemini quota exceeded, using fallback mode...");
        return this.generateFallbackAnalysis(text, userCurrency);
      } else if (error.message.includes("API key")) {
        throw new Error(
          "Invalid Gemini API key. Please check your configuration."
        );
      } else if (error.message.includes("rate limit")) {
        throw new Error(
          "Gemini API rate limit exceeded. Please try again later."
        );
      } else if (
        error.message.includes("Invalid AI response format") ||
        error.message.includes("Unable to parse AI response JSON")
      ) {
        await logger.warn("AI response parsing failed, using fallback mode");
        console.log("AI response parsing failed, using fallback mode...");
        return this.generateFallbackAnalysis(text, userCurrency);
      }

      throw new Error(`Failed to analyze bank statement: ${error.message}`);
    }
  }

  // Detect currency from PDF content
  async detectCurrency(text) {
    try {
      await logger.info("Starting currency detection");
      
      const currencyPrompt = `
Analyze the following bank statement text and detect the currency used.
Return ONLY the currency code (e.g., USD, EUR, GBP, JPY, CAD, AUD, etc.) in uppercase.

Common currency patterns to look for:
- $ = USD
- € = EUR
- £ = GBP
- ¥ = JPY
- C$ = CAD
- A$ = AUD
- ₹ = INR
- ₽ = RUB
- ₩ = KRW
- ₪ = ILS
- ₨ = PKR
- ₦ = NGN
- ₨ = LKR
- ₱ = PHP
- ฿ = THB
- ₫ = VND
- ₴ = UAH
- ₸ = KZT
- ₼ = AZN
- ₾ = GEL
- ₺ = TRY
- ₻ = LVL
- ₼ = AZN
- ₽ = RUB
- ₾ = GEL
- ₿ = BTC (Bitcoin)
- Ξ = ETH (Ethereum)

Bank statement text:
${text.substring(0, 2000)}
      `;

      const result = await this.model.generateContent(currencyPrompt);
      const response = await result.response;
      const detectedCurrency = response.text().trim().toUpperCase();

      await logger.info("Currency detection result", {
        detectedCurrency: detectedCurrency,
        originalResponse: response.text()
      });

      // Accept any valid 3-letter currency code
      if (
        detectedCurrency &&
        detectedCurrency.length === 3 &&
        /^[A-Z]{3}$/.test(detectedCurrency)
      ) {
        console.log(`Detected currency: ${detectedCurrency}`);
        return detectedCurrency;
      } else {
        console.log(
          `Invalid currency detected: ${detectedCurrency}, defaulting to IDR`
        );
        return "IDR";
      }
    } catch (error) {
      await logger.logError(error, { method: "detectCurrency" });
      console.log("Currency detection failed, defaulting to IDR");
      return "IDR";
    }
  }

  // Fallback method for when Gemini is not available
  async generateFallbackAnalysis(text, userCurrency = "IDR") {
    await logger.info("Starting fallback analysis", {
      userCurrency: userCurrency,
      textLength: text.length
    });
    
    console.log("Generating fallback analysis...");

    // Extract some basic information from the text
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    const transactions = [];

    // Simple regex patterns to find transactions
    const amountPattern = /(\$?\d+,?\d*\.?\d*)/g;
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/g;

    lines.forEach((line, index) => {
      const amounts = line.match(amountPattern);
      const dates = line.match(datePattern);

      if (amounts && amounts.length > 0) {
        const amount = parseFloat(amounts[0].replace(/[$,]/g, ""));
        const date = dates ? dates[0] : moment().format("YYYY-MM-DD");
        const description = line
          .replace(amountPattern, "")
          .replace(datePattern, "")
          .trim();

        if (description.length > 3 && amount > 0) {
          transactions.push({
            date: date,
            description: description.substring(0, 50),
            amount: amount,
            type: amount > 0 ? "credit" : "debit",
            category: this.categorizeTransaction(description),
          });
        }
      }
    });

    // Generate summary
    const totalIncome = transactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalExpenses = transactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Group by category
    const categories = {};
    transactions.forEach((transaction) => {
      if (!categories[transaction.category]) {
        categories[transaction.category] = {
          total: 0,
          count: 0,
          transactions: [],
        };
      }
      categories[transaction.category].total += Math.abs(transaction.amount);
      categories[transaction.category].count += 1;
      categories[transaction.category].transactions.push(transaction);
    });

    const result = {
      summary: {
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        period: "Fallback Analysis",
        accountNumber: "****",
      },
      categories,
      allTransactions: transactions,
      currency: userCurrency,
    };

    await logger.logTransactionAnalysis(
      result.allTransactions,
      result.categories,
      result.summary
    );

    return result;
  }

  // Simple categorization logic
  categorizeTransaction(description) {
    const desc = description.toLowerCase();

    // Income categories (for credit transactions)
    if (
      desc.includes("salary") ||
      desc.includes("deposit") ||
      desc.includes("income") ||
      desc.includes("payment") ||
      desc.includes("credit") ||
      desc.includes("refund") ||
      desc.includes("reimbursement") ||
      desc.includes("dividend") ||
      desc.includes("interest") ||
      desc.includes("rental") ||
      desc.includes("freelance") ||
      desc.includes("gig") ||
      desc.includes("business") ||
      desc.includes("investment return")
    ) {
      return "Salary/Income";
    }

    // Expense categories (for debit transactions)
    if (
      desc.includes("food") ||
      desc.includes("restaurant") ||
      desc.includes("cafe") ||
      desc.includes("dining") ||
      desc.includes("groceries")
    ) {
      return "Food & Dining";
    } else if (
      desc.includes("gas") ||
      desc.includes("fuel") ||
      desc.includes("uber") ||
      desc.includes("lyft") ||
      desc.includes("transport") ||
      desc.includes("parking") ||
      desc.includes("toll")
    ) {
      return "Transportation";
    } else if (
      desc.includes("amazon") ||
      desc.includes("walmart") ||
      desc.includes("target") ||
      desc.includes("shop") ||
      desc.includes("store") ||
      desc.includes("mall")
    ) {
      return "Shopping";
    } else if (
      desc.includes("electric") ||
      desc.includes("water") ||
      desc.includes("gas") ||
      desc.includes("utility") ||
      desc.includes("internet") ||
      desc.includes("phone") ||
      desc.includes("cable")
    ) {
      return "Bills & Utilities";
    } else if (
      desc.includes("netflix") ||
      desc.includes("spotify") ||
      desc.includes("entertainment") ||
      desc.includes("movie") ||
      desc.includes("game")
    ) {
      return "Entertainment";
    } else if (
      desc.includes("doctor") ||
      desc.includes("medical") ||
      desc.includes("pharmacy") ||
      desc.includes("hospital") ||
      desc.includes("dental")
    ) {
      return "Healthcare";
    } else if (
      desc.includes("hotel") ||
      desc.includes("flight") ||
      desc.includes("travel") ||
      desc.includes("vacation")
    ) {
      return "Travel";
    } else if (
      desc.includes("school") ||
      desc.includes("university") ||
      desc.includes("education") ||
      desc.includes("course")
    ) {
      return "Education";
    } else if (
      desc.includes("investment") ||
      desc.includes("stock") ||
      desc.includes("trading")
    ) {
      return "Investment";
    } else {
      return "Other";
    }
  }

  buildAnalysisPrompt(text, currency = "IDR") {
    return `
You are a financial analysis expert. Analyze the following bank statement text and extract transaction information.

The currency used in this statement is: ${currency}

IMPORTANT: You must return ONLY a valid JSON object with no additional text, explanations, or formatting outside the JSON.

CRITICAL JSON REQUIREMENTS:
- Use double quotes for all strings
- No trailing commas
- No comments
- No markdown formatting
- No extra text before or after the JSON

Return ONLY this exact JSON structure:

{
  "summary": {
    "totalIncome": number,
    "totalExpenses": number,
    "netAmount": number,
    "period": "string",
    "accountNumber": "string"
  },
  "categories": {
    "categoryName": {
      "total": number,
      "count": number,
      "transactions": [
        {
          "date": "YYYY-MM-DD",
          "description": "string",
          "amount": number,
          "type": "credit|debit"
        }
      ]
    }
  },
  "allTransactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "string",
      "amount": number,
      "type": "credit|debit",
      "category": "string"
    }
  ]
}

Use these categories for EXPENSES (debit transactions):
- Food & Dining
- Transportation
- Shopping
- Bills & Utilities
- Entertainment
- Healthcare
- Travel
- Education
- Investment
- Other

Use these categories for INCOME (credit transactions):
- Salary/Income
- Freelance/Gig Work
- Investment Returns
- Refunds/Reimbursements
- Business Income
- Rental Income
- Interest/Dividends
- Other Income

IMPORTANT RULES: 
- Credit transactions (positive amounts) should be categorized as INCOME categories
- Debit transactions (negative amounts) should be categorized as EXPENSE categories
- Do NOT categorize income transactions as expenses
- Ensure all JSON is properly formatted with double quotes

Bank statement text to analyze:
${text.substring(0, 8000)}
    `;
  }

  async parseAIResponse(response) {
    try {
      await logger.info("Starting JSON parsing", {
        responseLength: response.length,
        responsePreview: response.substring(0, 500) + '...'
      });

      // First, try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        await logger.error("No valid JSON found in AI response", { response });
        throw new Error("No valid JSON found in AI response");
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
        await logger.logJSONParsing(jsonMatch[0], null, true);
      } catch (parseError) {
        await logger.warn("Initial JSON parse failed, attempting to fix common issues", {
          parseError: parseError.message,
          originalJson: jsonMatch[0]
        });
        
        console.error(
          "Initial JSON parse failed, attempting to fix common issues..."
        );

        // Try to fix common JSON issues
        let fixedJson = jsonMatch[0];

        // Fix trailing commas
        fixedJson = fixedJson.replace(/,(\s*[}\]])/g, "$1");

        // Fix missing quotes around property names
        fixedJson = fixedJson.replace(
          /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
          '$1"$2":'
        );

        // Fix single quotes to double quotes
        fixedJson = fixedJson.replace(/'/g, '"');

        // Remove any trailing commas before closing braces/brackets
        fixedJson = fixedJson.replace(/,(\s*[}\]])/g, "$1");

        try {
          parsed = JSON.parse(fixedJson);
          await logger.logJSONParsing(jsonMatch[0], fixedJson, true);
        } catch (secondError) {
          await logger.error("Failed to fix JSON, using fallback analysis", {
            originalJson: jsonMatch[0],
            fixedJson: fixedJson,
            secondError: secondError.message
          });
          console.error("Failed to fix JSON, using fallback analysis");
          throw new Error("Unable to parse AI response JSON");
        }
      }

      // Validate and clean the response
      return this.validateAndCleanResponse(parsed);
    } catch (error) {
      await logger.logError(error, { method: "parseAIResponse" });
      console.error("Failed to parse AI response:", error);
      throw new Error("Invalid AI response format");
    }
  }

  validateAndCleanResponse(data) {
    // Ensure required fields exist
    if (!data.summary || !data.categories || !data.allTransactions) {
      throw new Error("Missing required fields in AI response");
    }

    // Clean and validate transactions
    const cleanedTransactions = data.allTransactions
      .filter((t) => t.date && t.description && typeof t.amount === "number")
      .map((t) => ({
        ...t,
        date: moment(t.date).isValid() ? t.date : moment().format("YYYY-MM-DD"),
        amount: parseFloat(t.amount) || 0,
        type: ["credit", "debit"].includes(t.type) ? t.type : "debit",
      }));

    // Recalculate summary
    const totalIncome = cleanedTransactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalExpenses = cleanedTransactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      summary: {
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        period: data.summary.period || "Unknown Period",
        accountNumber: data.summary.accountNumber || "****",
      },
      categories: data.categories || {},
      allTransactions: cleanedTransactions,
    };
  }

  async generateChartData(analysis) {
    const categories = Object.keys(analysis.categories);
    const chartData = {
      labels: categories,
      datasets: [
        {
          label: "Expenses by Category",
          data: categories.map((cat) => analysis.categories[cat].total),
          backgroundColor: this.generateColors(categories.length),
          borderWidth: 2,
        },
      ],
    };

    return chartData;
  }

  // Generate separate income and expense charts
  async generateIncomeExpenseCharts(analysis) {
    const categories = analysis.categories;

    // Separate income and expense categories
    const incomeCategories = {};
    const expenseCategories = {};

    Object.entries(categories).forEach(([category, data]) => {
      const isIncome = this.isIncomeCategory(category);
      if (isIncome) {
        incomeCategories[category] = data;
      } else {
        expenseCategories[category] = data;
      }
    });

    // Generate expense chart
    const expenseChartData = {
      labels: Object.keys(expenseCategories),
      datasets: [
        {
          label: "Expenses by Category",
          data: Object.values(expenseCategories).map((cat) => cat.total),
          backgroundColor: this.generateColors(
            Object.keys(expenseCategories).length
          ),
          borderWidth: 2,
        },
      ],
    };

    // Generate income chart
    const incomeChartData = {
      labels: Object.keys(incomeCategories),
      datasets: [
        {
          label: "Income by Category",
          data: Object.values(incomeCategories).map((cat) => cat.total),
          backgroundColor: this.generateIncomeColors(
            Object.keys(incomeCategories).length
          ),
          borderWidth: 2,
        },
      ],
    };

    return {
      expenseChart: expenseChartData,
      incomeChart: incomeChartData,
    };
  }

  // Helper method to determine if a category is income
  isIncomeCategory(category) {
    const incomeCategories = [
      "Salary/Income",
      "Freelance/Gig Work",
      "Investment Returns",
      "Refunds/Reimbursements",
      "Business Income",
      "Rental Income",
      "Interest/Dividends",
      "Other Income",
    ];
    return incomeCategories.includes(category);
  }

  // Generate colors for expense categories
  generateColors(count) {
    const colors = [
      "#FF6384", // Red
      "#36A2EB", // Blue
      "#FFCE56", // Yellow
      "#4BC0C0", // Teal
      "#9966FF", // Purple
      "#FF9F40", // Orange
      "#FF6384", // Red
      "#C9CBCF", // Gray
      "#4BC0C0", // Teal
      "#FF6384", // Red
      "#36A2EB", // Blue
      "#FFCE56", // Yellow
    ];

    return colors.slice(0, count);
  }

  // Generate colors for income categories (greener tones)
  generateIncomeColors(count) {
    const colors = [
      "#4CAF50", // Green
      "#8BC34A", // Light Green
      "#CDDC39", // Lime
      "#FFEB3B", // Yellow
      "#FFC107", // Amber
      "#FF9800", // Orange
      "#FF5722", // Deep Orange
      "#795548", // Brown
      "#9E9E9E", // Grey
      "#607D8B", // Blue Grey
      "#4CAF50", // Green
      "#8BC34A", // Light Green
    ];

    return colors.slice(0, count);
  }

  // Get currency symbol for formatting
  getCurrencySymbol(currency) {
    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
      INR: "₹",
      RUB: "₽",
      KRW: "₩",
      ILS: "₪",
      CHF: "CHF",
      SGD: "S$",
      HKD: "HK$",
      NZD: "NZ$",
    };
    return symbols[currency] || currency;
  }

  // Format currency amount
  formatCurrency(amount, currency = "USD") {
    const symbol = this.getCurrencySymbol(currency);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

module.exports = new AIService();
