// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.log("Hello from Functions!");

// Helper function for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Serve function without JWT verification
Deno.serve(async (req) => {
  console.log("Processing mock streaming request");

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
        // Initial status
        sendChunk({ type: "status", message: "✅ Starting PDF processing..." });
        await delay(500);

        sendChunk({
          type: "status",
          message: "✅ Extracting text from PDF...",
        });
        await delay(1000);

        sendChunk({
          type: "status",
          message:
            "✅ PDF processed successfully. Found 7 pages and extracted 33006 characters.",
        });
        await delay(800);

        sendChunk({ type: "status", message: "✅ Starting AI analysis..." });
        await delay(600);

        // Simulate AI thinking process
        const aiThinkingSteps = [
          "🤔 Starting AI analysis...",
          "📊 Analyzing bank statement structure...",
          "🔍 Detecting transaction patterns...",
          "💰 Categorizing income and expenses...",
          "📈 Calculating totals and summaries...",
          "🏷️ Assigning categories to transactions...",
          "📋 Validating data accuracy...",
          "⚡ Processing... (5 chunks analyzed)",
          "⚡ Processing... (10 chunks analyzed)",
          "⚡ Processing... (15 chunks analyzed)",
          "⚡ Processing... (20 chunks analyzed)",
          "✅ Analysis complete! Parsing results...",
        ];

        for (const step of aiThinkingSteps) {
          sendChunk({ type: "analysis_chunk", content: step });
          await delay(300 + Math.random() * 200); // Random delay between 300-500ms
        }

        sendChunk({
          type: "status",
          message: "✅ Analysis completed. Finalizing results...",
        });
        await delay(500);

        // Mock analysis result
        const mockResult = {
          type: "complete",
          data: {
            currency: "IDR",
            currencySymbol: "Rp",
            summary: {
              totalIncome: 14349026,
              totalExpenses: 14647913,
              netAmount: -298887,
              period: "June 2025",
              accountNumber: "0760170721",
            },
            categories: {
              "Salary/Income": {
                total: 11939452.6,
                count: 1,
                transactions: [
                  {
                    date: "2025-06-30",
                    description: "PAYROLL JUN 2025",
                    amount: 11939452.6,
                    type: "credit",
                  },
                ],
              },
              "Food & Dining": {
                total: 55000,
                count: 2,
                transactions: [
                  {
                    date: "2025-06-18",
                    description: "QR 777",
                    amount: 9500,
                    type: "debit",
                  },
                  {
                    date: "2025-06-18",
                    description: "QR 009",
                    amount: 21000,
                    type: "debit",
                  },
                ],
              },
              Transportation: {
                total: 15400,
                count: 1,
                transactions: [
                  {
                    date: "2025-06-18",
                    description: "TRSF E-BANKING DB 1806/FTFVA/WS95221",
                    amount: 15400,
                    type: "debit",
                  },
                ],
              },
              Shopping: {
                total: 118000,
                count: 1,
                transactions: [
                  {
                    date: "2025-06-18",
                    description: "DB INTERCHANGE Gopay-Gojek",
                    amount: 118000,
                    type: "debit",
                  },
                ],
              },
              "Bills & Utilities": {
                total: 15000,
                count: 1,
                transactions: [
                  {
                    date: "2025-06-20",
                    description: "BIAYA ADM",
                    amount: 15000,
                    type: "debit",
                  },
                ],
              },
              Other: {
                total: 1050000,
                count: 3,
                transactions: [
                  {
                    date: "2025-06-20",
                    description: "TRSF E-BANKING DB 2006/FTSCY/WS95271",
                    amount: 35000,
                    type: "debit",
                  },
                  {
                    date: "2025-06-21",
                    description: "SWITCHING CR DR 542",
                    amount: 500000,
                    type: "credit",
                  },
                  {
                    date: "2025-06-22",
                    description: "TRSF E-BANKING DB",
                    amount: 15000,
                    type: "debit",
                  },
                ],
              },
            },
            allTransactions: [
              {
                date: "2025-06-18",
                description: "QR 777",
                amount: 9500,
                type: "debit",
                category: "Food & Dining",
              },
              {
                date: "2025-06-18",
                description: "QR 009",
                amount: 21000,
                type: "debit",
                category: "Food & Dining",
              },
              {
                date: "2025-06-18",
                description: "TRSF E-BANKING DB 1806/FTFVA/WS95221",
                amount: 15400,
                type: "debit",
                category: "Transportation",
              },
              {
                date: "2025-06-18",
                description: "DB INTERCHANGE Gopay-Gojek",
                amount: 118000,
                type: "debit",
                category: "Shopping",
              },
              {
                date: "2025-06-20",
                description: "TRSF E-BANKING DB 2006/FTSCY/WS95271",
                amount: 35000,
                type: "debit",
                category: "Other",
              },
              {
                date: "2025-06-20",
                description: "BI-FAST CRBIF TRANSFER DR",
                amount: 100000,
                type: "credit",
                category: "Other",
              },
              {
                date: "2025-06-20",
                description: "TRSF E-BANKING DB 2006/FTFVA/WS95271",
                amount: 847385,
                type: "debit",
                category: "Other",
              },
              {
                date: "2025-06-20",
                description: "BIAYA ADM",
                amount: 15000,
                type: "debit",
                category: "Bills & Utilities",
              },
              {
                date: "2025-06-21",
                description: "SWITCHING CR DR 542",
                amount: 500000,
                type: "credit",
                category: "Other",
              },
              {
                date: "2025-06-21",
                description: "TRSF E-BANKING DB 2106/FTSCY/WS95271",
                amount: 50000,
                type: "debit",
                category: "Other",
              },
              {
                date: "2025-06-22",
                description: "TRSF E-BANKING DB",
                amount: 15000,
                type: "debit",
                category: "Other",
              },
              {
                date: "2025-06-24",
                description: "QR 014",
                amount: 46000,
                type: "debit",
                category: "Food & Dining",
              },
              {
                date: "2025-06-25",
                description: "TRSF E-BANKING DB 2506/FTSCY/WS95271",
                amount: 200000,
                type: "debit",
                category: "Other",
              },
              {
                date: "2025-06-26",
                description: "DB INTERCHANGE Grab* A-8XUEUQ3GX2",
                amount: 45500,
                type: "debit",
                category: "Transportation",
              },
              {
                date: "2025-06-27",
                description: "BI-FAST CRBIF TRANSFER DR",
                amount: 1000000,
                type: "credit",
                category: "Other",
              },
              {
                date: "2025-06-27",
                description: "KARTU DEBIT SABAK ADVENTURE ST",
                amount: 775000,
                type: "debit",
                category: "Shopping",
              },
              {
                date: "2025-06-27",
                description: "BI-FAST CRBIF TRANSFER DR",
                amount: 170000,
                type: "credit",
                category: "Other",
              },
              {
                date: "2025-06-27",
                description: "TARIKAN ATM 27/06",
                amount: 400000,
                type: "debit",
                category: "Other",
              },
              {
                date: "2025-06-28",
                description: "QRC014",
                amount: 9000,
                type: "debit",
                category: "Food & Dining",
              },
              {
                date: "2025-06-30",
                description: "KR OTOMATIS TRF KOLEKTIF",
                amount: 11939452.6,
                type: "credit",
                category: "Salary/Income",
              },
              {
                date: "2025-06-30",
                description: "TRSF E-BANKING DB 3006/FTSCY/WS95271",
                amount: 50000,
                type: "debit",
                category: "Other",
              },
              {
                date: "2025-06-30",
                description: "TRSF E-BANKING DB 3006/FTSCY/WS95271",
                amount: 600000,
                type: "debit",
                category: "Other",
              },
            ],
            chartData: {
              expenseChart: {
                labels: [
                  "Food & Dining",
                  "Transportation",
                  "Shopping",
                  "Bills & Utilities",
                  "Other",
                ],
                datasets: [
                  {
                    label: "Expenses by Category",
                    data: [55000, 15400, 118000, 15000, 1050000],
                    backgroundColor: [
                      "#FF6384",
                      "#36A2EB",
                      "#FFCE56",
                      "#4BC0C0",
                      "#9966FF",
                    ],
                    borderWidth: 2,
                  },
                ],
              },
              incomeChart: {
                labels: ["Salary/Income"],
                datasets: [
                  {
                    label: "Income by Category",
                    data: [11939452.6],
                    backgroundColor: ["#4CAF50"],
                    borderWidth: 2,
                  },
                ],
              },
            },
            processingInfo: {
              pages: 7,
              fileId: "mock-2025-06-30",
              processedAt: new Date().toISOString(),
              detectedCurrency: "IDR",
            },
          },
        };

        sendChunk(mockResult);
        controller.close();
      } catch (error) {
        console.error("Mock streaming error:", error);
        sendChunk({
          type: "error",
          message: "Mock analysis failed",
        });
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
    },
  });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54331/functions/v1/analyze-mock' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
