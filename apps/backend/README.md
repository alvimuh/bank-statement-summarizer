# Bank Statement Summarizer Backend

This is the backend API for the Bank Statement Summarizer application. It provides endpoints for uploading and analyzing bank statement PDFs, generating insights, and exporting data.

## Features

- PDF text extraction with OCR fallback
- AI-powered transaction analysis
- Categorization of income and expenses
- Chart data generation
- CSV export functionality
- Streaming analysis updates

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the backend directory: `cd apps/backend`
3. Install dependencies: `npm install`
4. Copy the environment variables: `cp env.example .env`
5. Update the `.env` file with your configuration
6. Start the development server: `npm run dev`

## API Endpoints

### Health Check

```
GET /api/health
```

### Upload and Analyze

```
POST /api/upload/analyze-v2
```

Uploads a PDF bank statement and returns streaming analysis results.

### Mock Analysis (for testing)

```
POST /api/upload/analyze-mock
```

Provides mock streaming analysis results for testing.

### Export Data

```
POST /api/export/csv/complete
POST /api/export/csv/transactions
POST /api/export/csv/summary
```

Exports analysis data in CSV format.

## Deployment

### Vercel Deployment

This backend can be deployed to Vercel. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.

## License

MIT