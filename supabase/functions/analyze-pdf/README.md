# PDF Text Extraction Implementation

## Implementation Details

The `extractTextFromPDF` function in `index.ts` has been updated to use the `pdf-parse` npm package to extract text from PDF files. This implementation:

1. Imports the `pdf-parse` package using Deno's npm compatibility
2. Processes the PDF file's ArrayBuffer to extract text
3. Returns the extracted text or throws an error with details if extraction fails

## Testing

To test this implementation, you need a PDF file. You can:

1. Create a simple PDF file using an online PDF creator
2. Use an existing PDF file from your system
3. Download a sample PDF file from the internet

Then, use curl to upload the PDF file to the endpoint:

```bash
curl -X POST -F "file=@/path/to/your/test.pdf" http://127.0.0.1:54331/functions/v1/analyze-pdf
```

The server will process the PDF file, extract text using the new implementation, and return the analysis results as a Server-Sent Events (SSE) stream.

## Troubleshooting

If you encounter any issues:

1. Check the server logs for error messages
2. Verify that the PDF file is valid and contains text (not just images)
3. Ensure the `GEMINI_API_KEY` environment variable is set correctly