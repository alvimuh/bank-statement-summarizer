# Migration Guide: Express.js to Supabase Edge Functions

This guide provides instructions for migrating from the Express.js backend to the Supabase Edge Function for the Bank Statement Summarizer application.

## Why Migrate?

Supabase Edge Functions offer several advantages:

- **Serverless Architecture**: No need to manage server infrastructure
- **Global Distribution**: Low-latency access from anywhere in the world
- **Automatic Scaling**: Handles traffic spikes without manual intervention
- **Cost Efficiency**: Pay only for what you use
- **Simplified Deployment**: Streamlined deployment process

## Migration Steps

### 1. Set Up Supabase Project

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```
4. Log in to Supabase:
   ```bash
   supabase login
   ```

### 2. Configure Environment Variables

1. Navigate to the Supabase Edge Function directory:
   ```bash
   cd supabase/functions/node-api
   ```

2. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```

3. Add your Google Gemini API key to the `.env` file:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 3. Deploy the Edge Function

1. Link to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. Deploy the function:
   ```bash
   supabase functions deploy node-api --no-verify-jwt
   ```

   Note: Use `--no-verify-jwt` for public access. For authenticated access, remove this flag.

3. Set environment variables in Supabase:
   ```bash
   supabase secrets set --env-file .env
   # Or set them individually
   supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   Note: The Edge Function uses `process.env` to access environment variables, not `Deno.env`.

### 4. Update Frontend Configuration

1. Navigate to the frontend directory:
   ```bash
   cd apps/frontend
   ```

2. Update the `.env.local` file to use the Supabase Edge Function URL:
   ```
   VITE_API_URL=https://your-project-ref.supabase.co/functions/v1/node-api
   ```

3. Rebuild and deploy the frontend:
   ```bash
   npm run build
   ```

### 5. Test the Migration

1. Upload a bank statement PDF through the frontend
2. Verify that the analysis is completed successfully
3. Check that all features (categorization, charts, etc.) work as expected

## API Differences

### Request Format

Both the Express.js backend and Supabase Edge Function accept multipart/form-data with:
- `file`: The PDF file to analyze
- `currency` (optional): The preferred currency for analysis

### Response Format

The response format is identical between both implementations:

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

## Authentication

### Public Access

If your application doesn't require authentication, deploy with:

```bash
supabase functions deploy node-api --no-verify-jwt
```

### Authenticated Access

For authenticated access:

1. Deploy without the `--no-verify-jwt` flag:
   ```bash
   supabase functions deploy node-api
   ```

2. Update frontend requests to include the Supabase authentication token:
   ```javascript
   const { data: { session } } = await supabase.auth.getSession()
   
   const formData = new FormData()
   formData.append('file', pdfFile)
   
   const response = await fetch('https://your-project-ref.supabase.co/functions/v1/node-api', {
     method: 'POST',
     body: formData,
     headers: {
       'Authorization': `Bearer ${session.access_token}`
     }
   })
   ```

## Troubleshooting

### Function Timeout

If you encounter timeouts with large PDFs:

1. Consider implementing chunking strategies
2. Optimize the PDF processing pipeline
3. Increase the function timeout in Supabase settings (if available)

### CORS Issues

If you encounter CORS errors:

1. Verify that the Edge Function includes proper CORS headers
2. Check that your frontend is using the correct URL

### Memory Limitations

If you encounter memory issues with large PDFs:

1. Implement streaming for large files
2. Process PDFs page by page
3. Consider using external storage for temporary files

## Rollback Plan

If you need to revert to the Express.js backend:

1. Update the frontend `.env.local` file to use the Express.js API URL
2. Rebuild and deploy the frontend

## Conclusion

Migrating to Supabase Edge Functions provides a modern, scalable architecture for the Bank Statement Summarizer application. The serverless approach eliminates infrastructure management while providing global distribution and automatic scaling.