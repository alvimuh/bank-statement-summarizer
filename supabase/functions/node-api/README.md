# Bank Statement Summarizer - Supabase Edge Function

This Supabase Edge Function provides PDF bank statement analysis capabilities using AI. It processes uploaded PDF files, extracts text content, and uses Google's Gemini AI to analyze and categorize transactions. The function is implemented in a single file for simplicity and easier maintenance.

## Features

- PDF processing with text extraction
- OCR fallback for image-based PDFs
- AI-powered transaction analysis
- Currency detection and customization
- Transaction categorization
- Income/expense chart data generation
- CORS support for cross-origin requests

## Prerequisites

- Supabase account and project
- Google Gemini API key

## Environment Variables

For local development, create a `.env` file in the function directory with the following variables:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

For deployment, set the environment variables using the Supabase CLI:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

## Deployment

### Local Development

1. Install Supabase CLI
2. Run the function locally:

```bash
supabase functions serve --no-verify-jwt
```

### Production Deployment

Deploy to your Supabase project:

```bash
supabase functions deploy node-api --no-verify-jwt
```

To enable JWT verification in production:

```bash
supabase functions deploy node-api
```

## Usage

Send a POST request to the function endpoint with a multipart/form-data body containing:

- `file`: PDF file to analyze
- `currency` (optional): Preferred currency for analysis

### Example Request

```javascript
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('currency', 'USD'); // Optional

const response = await fetch('https://your-project-ref.supabase.co/functions/v1/node-api', {
  method: 'POST',
  body: formData,
  headers: {
    // Include authorization header if JWT verification is enabled
    // 'Authorization': `Bearer ${supabaseAccessToken}`
  }
});

const result = await response.json();
```

### Response Format

Successful response:

```json
{
  "success": true,
  "message": "PDF analyzed successfully",
  "data": {
    "summary": { /* Summary data */ },
    "categories": { /* Categorized transactions */ },
    "allTransactions": [ /* All transactions */ ],
    "chartData": { /* Chart visualization data */ },
    "currency": "USD",
    "processingInfo": {
      "pages": 2,
      "fileId": "uuid",
      "processedAt": "2023-06-15T12:34:56.789Z",
      "detectedCurrency": "USD"
    }
  }
}
```

Error response:

```json
{
  "error": "Analysis failed",
  "message": "Error details"
}
```

## Dependencies

- pdf-parse: PDF text extraction
- tesseract.js: OCR for image-based PDFs
- @google/generative-ai: Google Gemini AI integration
- uuid: Unique ID generation
- moment: Date handling
- busboy: Multipart form parsing

## Notes

- The function has a maximum execution time of 60 seconds
- Maximum file size is determined by Supabase limits (default 50MB)
- For large PDFs, consider implementing pagination or chunking strategies