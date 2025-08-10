// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Import dependencies
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';
import moment from 'https://esm.sh/moment';
import pdfParse from 'npm:pdf-parse/lib/pdf-parse.js';
import Tesseract from 'https://esm.sh/tesseract.js';
import { v4 as uuidv4 } from 'https://esm.sh/uuid';
import { Buffer } from 'https://deno.land/std@0.177.0/node/buffer.ts';

// Get environment variables
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

// PDF Service
class PDFService {
  async processPDF(buffer: ArrayBuffer) {
    try {
      const fileId = uuidv4();
      
      // Convert ArrayBuffer to Buffer for pdf-parse
      const nodeBuffer = Buffer.from(buffer);
      
      // Extract text directly from buffer
      const pdfData = await pdfParse(nodeBuffer);

      // Check if we got meaningful text
      if (pdfData.text.trim().length < 50) {
        // Try OCR as fallback
        const ocrText = await this.performOCR(nodeBuffer);

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
    } catch (error: any) {
      console.error('PDF processing error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async performOCR(buffer: Buffer) {
    try {
      // Convert Buffer to Uint8Array for Tesseract
      const uint8Array = new Uint8Array(buffer);
      
      const result = await Tesseract.recognize(uint8Array, "eng");

      return result.data.text;
    } catch (error: any) {
      console.error("OCR processing failed:", error);
      throw new Error(`OCR failed: ${error.message}`);
    }
  }
}

// AI Service
class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 65536,
        temperature: 0.1,
      },
    });
  }

  async analyzeBankStatement(text: string, userCurrency: string | null = null) {
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
    } catch (error: any) {
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
      } else {
        throw new Error(`Analysis failed: ${error.message}`);
      }
    }
  }

  async detectCurrency(text: string): Promise<string> {
    try {
      const prompt = `
      You are a financial document analyzer. Your task is to detect the currency used in the following bank statement text.
      Return ONLY the currency code (USD, EUR, GBP, etc.) without any explanation or additional text.
      If you cannot determine the currency with confidence, return "USD" as the default.
      
      Bank statement text:
      ${text.substring(0, 2000)} // Using first 2000 chars for currency detection
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const currencyCode = response.text().trim().toUpperCase();

      // Validate currency code (basic validation)
      const validCurrencies = [
        "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", 
        "SEK", "NZD", "MXN", "SGD", "HKD", "NOK", "KRW", "TRY", 
        "RUB", "INR", "BRL", "ZAR", "ILS"
      ];

      if (validCurrencies.includes(currencyCode)) {
        console.log(`Detected currency: ${currencyCode}`);
        return currencyCode;
      } else {
        console.log(`Invalid currency detected: ${currencyCode}, using USD as default`);
        return "USD";
      }
    } catch (error) {
      console.error("Currency detection failed:", error);
      return "USD"; // Default to USD on error
    }
  }

  async generateStructuredAnalysis(text: string, currency: string): Promise<any> {
    const prompt = `
    You are a financial document analyzer. Analyze this bank statement text and extract the following information in a structured JSON format:
    
    1. Summary information (total income, total expenses, net amount, date range)
    2. Categorized transactions grouped by type (income vs expense) and category
    3. All individual transactions with dates, descriptions, amounts, and categories
    
    Bank statement text:
    ${text}
    
    Use this currency: ${currency}
    
    Respond ONLY with valid JSON in this exact format (no explanation or other text):
    {
      "summary": {
        "totalIncome": number,
        "totalExpenses": number,
        "netAmount": number,
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD",
        "accountInfo": {
          "accountNumber": "string or null",
          "accountHolder": "string or null",
          "bankName": "string or null"
        }
      },
      "categories": {
        "income": [
          {
            "category": "string",
            "amount": number,
            "percentage": number,
            "transactionCount": number
          }
        ],
        "expenses": [
          {
            "category": "string",
            "amount": number,
            "percentage": number,
            "transactionCount": number
          }
        ]
      },
      "allTransactions": [
        {
          "date": "YYYY-MM-DD",
          "description": "string",
          "amount": number,
          "type": "income or expense",
          "category": "string"
        }
      ]
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text();
      
      try {
        // Parse and validate the JSON response
        const analysis = JSON.parse(jsonText);
        
        // Basic validation
        if (!analysis.summary || !analysis.categories || !analysis.allTransactions) {
          throw new Error("Invalid analysis structure");
        }
        
        return analysis;
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        throw new Error("Failed to parse analysis results");
      }
    } catch (error) {
      console.error("Failed to generate analysis:", error);
      throw error;
    }
  }

  async generateIncomeExpenseCharts(analysis: any) {
    // Extract data for charts
    const incomeCategories = analysis.categories.income.map((cat: any) => ({
      name: cat.category,
      value: cat.amount,
      percentage: cat.percentage,
    }));

    const expenseCategories = analysis.categories.expenses.map((cat: any) => ({
      name: cat.category,
      value: cat.amount,
      percentage: cat.percentage,
    }));

    // Sort by value (highest first)
    incomeCategories.sort((a: any, b: any) => b.value - a.value);
    expenseCategories.sort((a: any, b: any) => b.value - a.value);

    // Generate monthly data if possible
    const monthlyData = this.generateMonthlyData(analysis.allTransactions);

    return {
      income: incomeCategories,
      expenses: expenseCategories,
      monthly: monthlyData,
    };
  }

  generateMonthlyData(transactions: any[]) {
    const monthlyIncome: Record<string, number> = {};
    const monthlyExpenses: Record<string, number> = {};
    const monthlyNet: Record<string, number> = {};

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort((a, b) =>
      moment(a.date).diff(moment(b.date))
    );

    // Group by month
    sortedTransactions.forEach((transaction) => {
      const monthKey = moment(transaction.date).format("YYYY-MM");

      // Initialize if not exists
      if (!monthlyIncome[monthKey]) monthlyIncome[monthKey] = 0;
      if (!monthlyExpenses[monthKey]) monthlyExpenses[monthKey] = 0;

      // Add to appropriate category
      if (transaction.type === "income") {
        monthlyIncome[monthKey] += transaction.amount;
      } else {
        monthlyExpenses[monthKey] += transaction.amount;
      }

      // Calculate net
      monthlyNet[monthKey] = monthlyIncome[monthKey] - monthlyExpenses[monthKey];
    });

    // Convert to array format for charts
    const result = Object.keys(monthlyIncome).map((month) => ({
      month,
      income: monthlyIncome[month],
      expenses: monthlyExpenses[month],
      net: monthlyNet[month],
    }));

    return result;
  }

  async generateFallbackAnalysis(text: string, userCurrency: string | null = null): Promise<any> {
    // Simple fallback analysis when AI is unavailable
    console.log("Using fallback analysis mode");
    
    // Default currency
    const currency = userCurrency || "USD";
    
    // Create a basic analysis structure
    return {
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        startDate: moment().subtract(1, 'month').format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD'),
        accountInfo: {
          accountNumber: null,
          accountHolder: null,
          bankName: null
        }
      },
      categories: {
        income: [
          {
            category: "Uncategorized Income",
            amount: 0,
            percentage: 100,
            transactionCount: 0
          }
        ],
        expenses: [
          {
            category: "Uncategorized Expenses",
            amount: 0,
            percentage: 100,
            transactionCount: 0
          }
        ]
      },
      allTransactions: [],
      currency: currency
    };
  }
}

// Helper function to parse multipart form data
async function parseFormData(req: Request): Promise<{ file: ArrayBuffer | null; currency: string | null }> {
  const contentType = req.headers.get('content-type') || '';
  
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Content type must be multipart/form-data');
  }
  
  const formData = await req.formData();
  const fileData = formData.get('file') as File | null;
  const currency = formData.get('currency') as string | null;
  
  if (!fileData) {
    throw new Error('No PDF file uploaded');
  }
  
  if (fileData.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed');
  }
  
  const fileBuffer = await fileData.arrayBuffer();
  
  return { file: fileBuffer, currency };
}

// Handle OPTIONS requests for CORS
function handleOptions(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Main analyze function
async function analyze(req: Request): Promise<Response> {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse the multipart form data
    const { file, currency } = await parseFormData(req);
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No PDF file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Processing PDF...');
    
    // Create service instances
    const pdfService = new PDFService();
    const aiService = new AIService(GEMINI_API_KEY);
    
    // Process PDF and extract text
    const pdfResult = await pdfService.processPDF(file);
    
    if (!pdfResult.success) {
      return new Response(JSON.stringify({ error: 'Failed to process PDF' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Analyze with AI (with currency detection/selection)
    const analysis = await aiService.analyzeBankStatement(
      pdfResult.text,
      currency || undefined
    );
    
    // Generate chart data
    const chartData = await aiService.generateIncomeExpenseCharts(analysis);
    
    // Return comprehensive analysis
    return new Response(
      JSON.stringify({
        success: true,
        message: 'PDF analyzed successfully',
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
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Analysis error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Analysis failed',
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Main serve handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleOptions(req);
  }
  
  // Process the analysis
  return await analyze(req);
});
