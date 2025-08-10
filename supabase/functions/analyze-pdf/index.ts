// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

console.log("Hello from Functions!");

// Helper function for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// PDF Service for processing PDF files
class PDFService {
  async processPDF(file: File) {
    try {
      const fileId = crypto.randomUUID();

      // Extract text from PDF
      const arrayBuffer = await file.arrayBuffer();
      const text = await this.extractTextFromPDF(arrayBuffer);

      // Check if we got meaningful text
      if (text.trim().length < 50) {
        // In Deno we would need a different OCR approach
        // For now, return an error if text extraction fails
        return {
          success: false,
          error: "Could not extract sufficient text from PDF",
        };
      }

      return {
        success: true,
        text: text,
        pages: 1, // Simplified - would need proper page counting
        fileId: fileId,
      };
    } catch (error) {
      console.error("PDF processing error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async extractTextFromPDF(arrayBuffer: ArrayBuffer) {
    try {
      // Import pdf-parse from npm, which is compatible with Deno
      const pdfParse = await import("npm:pdf-parse");

      // Parse the PDF using pdf-parse
      const data = await pdfParse.default(arrayBuffer);

      // Return the extracted text
      return data.text;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
}

// AI Service for analyzing bank statements
class AIService {
  private model: any;

  constructor() {
    // Initialize the Gemini API client
    const apiKey = Deno.env.get("GEMINI_API_KEY") || "";
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not set. AI analysis will not work.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async analyzeBankStatementStreaming(
    text: string,
    userCurrency: string | null = null,
    onChunk: ((chunk: string) => void) | null = null
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

      console.log({ detectedCurrency, text });

      // Use streaming for structured analysis
      const analysis = await this.generateStructuredAnalysisStreaming(
        text,
        detectedCurrency,
        onChunk
      );

      // Add currency information to the analysis
      analysis.currency = detectedCurrency;

      // Generate chart data (separate income and expense charts)
      const chartData = await this.generateIncomeExpenseCharts(analysis);
      analysis.chartData = chartData;

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
        throw new Error("AI analysis failed: Invalid API key");
      }

      throw new Error(`Failed to analyze bank statement: ${error.message}`);
    }
  }

  async detectCurrency(text: string): Promise<string> {
    // Simple currency detection based on common symbols and codes
    const currencyPatterns = [
      { pattern: /\$|USD|US Dollar/i, code: "USD" },
      { pattern: /€|EUR|Euro/i, code: "EUR" },
      { pattern: /£|GBP|British Pound/i, code: "GBP" },
      { pattern: /¥|JPY|Japanese Yen/i, code: "JPY" },
      { pattern: /₹|INR|Indian Rupee/i, code: "INR" },
      { pattern: /\bIDR\b|Rupiah/i, code: "IDR" },
      { pattern: /\bCAD\b|Canadian Dollar/i, code: "CAD" },
      { pattern: /\bAUD\b|Australian Dollar/i, code: "AUD" },
      { pattern: /\bCNY\b|Yuan|Renminbi/i, code: "CNY" },
      { pattern: /\bCHF\b|Swiss Franc/i, code: "CHF" },
    ];

    for (const { pattern, code } of currencyPatterns) {
      if (pattern.test(text)) {
        console.log(`Detected currency: ${code}`);
        return code;
      }
    }

    // Default to USD if no currency is detected
    console.log("No currency detected, defaulting to USD");
    return "USD";
  }

  // Generate structured analysis using streaming
  async generateStructuredAnalysisStreaming(
    text: string,
    currency: string,
    onChunk: ((chunk: string) => void) | null = null
  ) {
    try {
      const prompt = this.buildAnalysisPrompt(text, currency);

      console.log("Prompt length: ", prompt.length);

      if (onChunk) {
        onChunk("🤔 Starting AI analysis...");
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

      console.log("AI response complete, parsing JSON...");

      console.log({ fullResponse });
      // Extract JSON from the response
      let jsonText = this.extractJsonFromText(fullResponse);
      console.log("Extracted JSON text length:", jsonText.length);

      try {
        // Parse the JSON response
        const parsedData = JSON.parse(jsonText);
        return parsedData;
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        console.log("JSON text preview:", jsonText.substring(0, 200) + "...");

        // Try to clean and re-parse the JSON
        try {
          // Extract just the main JSON object if there's extra text
          const cleanedJson = this.cleanJsonText(jsonText);
          console.log("Cleaned JSON, attempting to parse again...");
          return JSON.parse(cleanedJson);
        } catch (secondError) {
          console.error("Second parsing attempt failed:", secondError);
          throw new Error("Failed to parse analysis results");
        }
      }
    } catch (error) {
      console.error("Error in generateStructuredAnalysisStreaming:", error);
      throw error;
    }
  }

  // Extract JSON from text that might contain markdown or other formatting
  extractJsonFromText(text: string): string {
    // First try to extract from markdown code blocks with json syntax
    const jsonCodeBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const jsonMatch = text.match(jsonCodeBlockRegex);

    if (jsonMatch && jsonMatch[1]) {
      console.log("Successfully extracted JSON from markdown code block");
      return jsonMatch[1].trim();
    }

    // If that fails, try to extract from any code block
    const codeBlockRegex = /```\s*([\s\S]*?)\s*```/;
    const codeMatch = text.match(codeBlockRegex);

    if (codeMatch && codeMatch[1]) {
      console.log("Extracted content from generic code block");
      return codeMatch[1].trim();
    }

    // If no code blocks, return the original text
    return text.trim();
  }

  // Clean JSON text by trying to extract just the main JSON object
  cleanJsonText(text: string): string {
    // Try to find the start and end of a JSON object
    const objectStartIndex = text.indexOf("{");
    const objectEndIndex = text.lastIndexOf("}");

    if (
      objectStartIndex !== -1 &&
      objectEndIndex !== -1 &&
      objectEndIndex > objectStartIndex
    ) {
      return text.substring(objectStartIndex, objectEndIndex + 1);
    }

    return text; // Return original if we can't find valid JSON object markers
  }

  // Generate chart data for income and expenses
  async generateIncomeExpenseCharts(analysis: any) {
    const categories = analysis.categories || {};
    const expenseLabels: string[] = [];
    const expenseData: number[] = [];
    const incomeLabels: string[] = [];
    const incomeData: number[] = [];

    // Standard colors for charts
    const expenseColors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#8AC249",
      "#EA5F89",
      "#00BFFF",
      "#FF6347",
    ];

    const incomeColors = [
      "#4CAF50",
      "#8BC34A",
      "#CDDC39",
      "#FFC107",
      "#FF9800",
    ];

    // Process categories into chart data
    Object.entries(categories).forEach(([name, data]: [string, any]) => {
      if (data.transactions && data.transactions.length > 0) {
        const firstTransaction = data.transactions[0];

        if (firstTransaction.type === "debit") {
          // Expense category
          expenseLabels.push(name);
          expenseData.push(data.total);
        } else {
          // Income category
          incomeLabels.push(name);
          incomeData.push(data.total);
        }
      }
    });

    return {
      expenseChart: {
        labels: expenseLabels,
        datasets: [
          {
            label: "Expenses by Category",
            data: expenseData,
            backgroundColor: expenseColors.slice(0, expenseLabels.length),
            borderWidth: 2,
          },
        ],
      },
      incomeChart: {
        labels: incomeLabels,
        datasets: [
          {
            label: "Income by Category",
            data: incomeData,
            backgroundColor: incomeColors.slice(0, incomeLabels.length),
            borderWidth: 2,
          },
        ],
      },
    };
  }

  // Generate fallback analysis when AI fails
  async generateFallbackAnalysis(
    text: string,
    userCurrency: string | null = null
  ) {
    console.log("Generating fallback analysis...");
    const currency = userCurrency || "USD";

    // Create a simple fallback analysis
    return {
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        period: "Unknown",
        accountNumber: "Unknown",
      },
      categories: {},
      allTransactions: [],
      currency: currency,
    };
  }

  // Build the prompt for the AI model
  buildAnalysisPrompt(text: string, currency = "USD") {
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
- NO CODE BLOCKS OR BACKTICKS

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
${text}
    `;
  }
}

// Create instances of the services
const pdfService = new PDFService();
const aiService = new AIService();

// Main handler function for analyze-pdf
async function handleAnalyzePdf(req: Request) {
  try {
    // Parse form data from the request
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userCurrency = (formData.get("currency") as string) || null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No PDF file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return new Response(
        JSON.stringify({ error: "Only PDF files are allowed" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Processing PDF:", file.name);

    // Create a stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        // Helper function to send chunks
        const sendChunk = (data: any) => {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // Send initial status
          sendChunk({ type: "status", message: "Starting PDF processing..." });
          await delay(500);

          // Process PDF and extract text
          sendChunk({ type: "status", message: "Extracting text from PDF..." });
          const pdfResult = await pdfService.processPDF(file);

          if (!pdfResult.success) {
            sendChunk({
              type: "error",
              message:
                "Failed to process PDF. Please ensure the file is a valid PDF.",
            });
            controller.close();
            return;
          }

          sendChunk({
            type: "status",
            message: `PDF processed successfully. Found ${pdfResult.pages} pages and extracted ${pdfResult.text.length} characters.`,
          });
          await delay(500);

          // Analyze with AI using streaming
          sendChunk({ type: "status", message: "Starting AI analysis..." });

          const analysis = await aiService.analyzeBankStatementStreaming(
            pdfResult.text,
            userCurrency,
            (chunk) => {
              sendChunk({
                type: "analysis_chunk",
                content: chunk,
              });
            }
          );

          sendChunk({
            type: "status",
            message: "Analysis completed. Finalizing results...",
          });
          await delay(500);

          // Send final result
          const finalResult = {
            type: "complete",
            data: {
              summary: analysis.summary,
              categories: analysis.categories,
              allTransactions: analysis.allTransactions,
              chartData: analysis.chartData,
              currency: analysis.currency,
              processingInfo: {
                pages: pdfResult.pages,
                fileId: pdfResult.fileId,
                processedAt: new Date().toISOString(),
                detectedCurrency: analysis.currency,
              },
            },
          };

          sendChunk(finalResult);
          controller.close();
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

          sendChunk({ type: "error", message: errorMessage });
          controller.close();
        }
      },
    });

    // Return the response with appropriate headers for SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("Error in handleAnalyzePdf:", error);
    return new Response(
      JSON.stringify({ error: "Analysis error: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Serve function without JWT verification
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Only accept POST requests for analysis
  if (req.method === "POST") {
    return handleAnalyzePdf(req);
  }

  // Return 405 Method Not Allowed for other methods
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
});
