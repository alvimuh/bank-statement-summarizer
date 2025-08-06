const { GoogleGenerativeAI } = require("@google/generative-ai");
const moment = require("moment");

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 65536,
        temperature: 0.1,
      },
    });
  }

  async analyzeBankStatement(text, userCurrency = null) {
    try {
      console.log(`Processing text of length: ${text.length} characters`);

      // First, detect currency from the PDF content
      const detectedCurrency =
        userCurrency || (await this.detectCurrency(text));

      // Use structured JSON response for reliable parsing
      const analysis = await this.generateStructuredAnalysis(
        text,
        detectedCurrency
      );

      // Add currency information to the analysis
      analysis.currency = detectedCurrency;

      return analysis;
    } catch (error) {
      console.error("AI analysis failed:", error);

      // Handle specific Gemini errors
      if (
        error.message.includes("quota") ||
        error.message.includes("quota exceeded")
      ) {
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
        error.message.includes("Unable to parse AI response JSON") ||
        error.message.includes("Structured analysis failed")
      ) {
        console.log("AI response parsing failed, using fallback mode...");
        return this.generateFallbackAnalysis(text, userCurrency);
      }

      throw new Error(`Failed to analyze bank statement: ${error.message}`);
    }
  }

  async analyzeBankStatementStreaming(
    text,
    userCurrency = null,
    onChunk = null
  ) {
    try {
      console.log(
        `Processing text of length: ${text.length} characters with streaming`
      );

      // First, detect currency from the PDF content
      const detectedCurrency =
        userCurrency || (await this.detectCurrency(text));

      if (onChunk) {
        onChunk(`Detected currency: ${detectedCurrency}`);
      }

      // Use streaming for structured analysis
      const analysis = await this.generateStructuredAnalysisStreaming(
        text,
        detectedCurrency,
        onChunk
      );

      // Add currency information to the analysis
      analysis.currency = detectedCurrency;

      return analysis;
    } catch (error) {
      console.error("Streaming AI analysis failed:", error);

      // Handle specific Gemini errors
      if (
        error.message.includes("quota") ||
        error.message.includes("quota exceeded")
      ) {
        console.log("Gemini quota exceeded, using fallback mode...");
        if (onChunk) {
          onChunk("Using fallback analysis due to API quota limits...");
        }
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
        error.message.includes("Unable to parse AI response JSON") ||
        error.message.includes("Structured analysis failed")
      ) {
        console.log("AI response parsing failed, using fallback mode...");
        if (onChunk) {
          onChunk("Using fallback analysis due to parsing issues...");
        }
        return this.generateFallbackAnalysis(text, userCurrency);
      }

      throw new Error(`Failed to analyze bank statement: ${error.message}`);
    }
  }

  // Generate structured analysis using improved prompting
  async generateStructuredAnalysis(text, currency) {
    try {
      const prompt = this.buildAnalysisPrompt(text, currency);

      console.log("Prompt length: ", prompt);
      // throw new Error("test");
      const result = await this.model.generateContentStream(prompt);
      const response = result.response;
      const textResponse = response.text();

      console.log(`Response length: ${textResponse.length} characters`);

      // Try to extract JSON from the response
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in AI response");
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return this.validateAndCleanResponse(analysis);
    } catch (error) {
      console.error("Structured analysis failed:", error);
      throw error;
    }
  }

  // Generate structured analysis using streaming
  async generateStructuredAnalysisStreaming(text, currency, onChunk = null) {
    try {
      const prompt = this.buildAnalysisPrompt(text, currency);

      console.log("Prompt length: ", prompt);

      if (onChunk) {
        onChunk("🤔 Starting AI analysis...");
        onChunk("📊 Analyzing bank statement structure...");
      }

      const result = await this.model.generateContentStream(prompt);
      let fullResponse = "";
      let chunkCount = 0;

      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullResponse += text;
        chunkCount++;

        if (onChunk) {
          // Provide more detailed updates about what the AI is doing
          if (chunkCount === 1) {
            onChunk("🔍 Detecting transaction patterns...");
          } else if (chunkCount === 5) {
            onChunk("💰 Categorizing income and expenses...");
          } else if (chunkCount === 10) {
            onChunk("📈 Calculating totals and summaries...");
          } else if (chunkCount === 15) {
            onChunk("🏷️ Assigning categories to transactions...");
          } else if (chunkCount === 20) {
            onChunk("📋 Validating data accuracy...");
          } else if (chunkCount % 5 === 0) {
            onChunk(`⚡ Processing... (${chunkCount} chunks analyzed)`);
          }

          // Also send the actual AI response chunks
          onChunk(text);
        }
      }

      console.log(`Response length: ${fullResponse.length} characters`);

      if (onChunk) {
        onChunk("✅ Analysis complete! Parsing results...");
      }

      // Try to extract JSON from the response
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in AI response");
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return this.validateAndCleanResponse(analysis);
    } catch (error) {
      console.error("Streaming structured analysis failed:", error);
      throw error;
    }
  }

  // Detect currency from PDF content
  async detectCurrency(text) {
    try {
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
${text.substring(0, 5000)}
      `;

      const result = await this.model.generateContent(currencyPrompt);
      const response = await result.response;
      const detectedCurrency = response.text().trim().toUpperCase();

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
      console.log("Currency detection failed, defaulting to IDR");
      return "IDR";
    }
  }

  // Fallback method for when Gemini is not available
  async generateFallbackAnalysis(text, userCurrency = "IDR") {
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
      "avgType": "credit|debit",
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
${text}
    `;
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
