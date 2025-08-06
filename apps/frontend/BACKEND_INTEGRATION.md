# Backend Integration Migration

This document outlines the backend integration that has been migrated from the old frontend to the new frontend.

## Services Created

### 1. API Base Configuration (`/src/services/api.ts`)
- Axios-based HTTP client with interceptors
- Environment variable support for API URL
- Request/response logging and error handling
- Timeout configuration (30 seconds)
- Base URL: `http://localhost:3001/api`

### 2. Upload Service (`/src/services/uploadService.ts`)
- **File Upload**: PDF upload with FormData
- **Streaming Analysis**: Server-Sent Events (SSE) for real-time updates
- **Mock Analysis**: Development/testing endpoint
- **Cancellation Support**: AbortController for request cancellation
- **Currency Support**: Optional currency parameter
- **Callbacks**: Status updates, analysis chunks, completion, and error handling

**Endpoints:**
- `POST /upload/analyze-v2` - Streaming analysis
- `POST /upload/analyze-mock` - Mock analysis
- `POST /upload/analyze` - Standard analysis
- `GET /health` - Health check

### 3. Export Service (`/src/services/exportService.ts`)
- **Complete Export**: Full analysis data export
- **Transactions Export**: Transaction data only
- **Summary Export**: Summary statistics only
- **File Download**: Automatic blob download with dynamic filenames
- **Type Safety**: Full TypeScript interfaces

**Endpoints:**
- `POST /export/complete`
- `POST /export/transactions`
- `POST /export/summary`

### 4. Analysis Service (`/src/services/analysisService.ts`)
- **Statistics**: Get analysis statistics
- **Text Analysis**: Analyze text content
- **Currency Support**: Get supported currencies
- **Data Validation**: Validate analysis results
- **Utility Functions**: Currency formatting, data processing

**Endpoints:**
- `GET /analysis/stats`
- `POST /analysis/text`
- `GET /analysis/currencies`

## TypeScript Interfaces

### AnalysisResult
```typescript
interface AnalysisResult {
  transactions: Transaction[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    transactionCount: number;
    currency: string;
    period: {
      start: string;
      end: string;
    };
  };
  categories: Category[];
  insights: string[];
}
```

### Transaction
```typescript
interface Transaction {
  id?: number;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}
```

## Updated Components

### Upload Page (`/src/pages/Upload.tsx`)
- **Real API Integration**: Replaced mock upload with actual backend calls
- **Currency Selection**: Dropdown for currency selection
- **Status Display**: Real-time status messages during analysis
- **Analysis Preview**: Live preview of analysis chunks
- **Cancellation**: Cancel button for ongoing analysis
- **Error Handling**: Comprehensive error handling with toast notifications

### Analysis Page (`/src/pages/Analysis.tsx`)
- **Real Data Display**: Uses actual analysis results instead of mock data
- **Export Functionality**: Multiple export options (complete, transactions, summary)
- **Filtering**: Search and category filtering for transactions
- **Currency Formatting**: Proper currency display based on analysis results
- **AI Insights**: Display of AI-generated insights
- **Charts**: Dynamic charts based on real category data

## Environment Configuration

### `.env` file
```
VITE_API_URL=http://localhost:3001/api
VITE_NODE_ENV=development
```

## Features Implemented

1. **File Upload with Progress**: Real-time upload progress and status
2. **Streaming Analysis**: Server-Sent Events for live analysis updates
3. **Export Functionality**: Multiple export formats with file download
4. **Currency Support**: Multi-currency support with proper formatting
5. **Search and Filtering**: Transaction search and category filtering
6. **Error Handling**: Comprehensive error handling with user feedback
7. **Cancellation**: Ability to cancel ongoing operations
8. **Type Safety**: Full TypeScript support with proper interfaces
9. **Real-time Updates**: Live status updates during processing
10. **AI Insights**: Display of backend-generated insights

## Backend Endpoints Expected

The frontend expects the following backend endpoints to be available:

- `POST /api/upload/analyze-v2` - Streaming analysis with SSE
- `POST /api/upload/analyze-mock` - Mock analysis for testing
- `POST /api/upload/analyze` - Standard analysis
- `POST /api/export/complete` - Export complete analysis
- `POST /api/export/transactions` - Export transactions only
- `POST /api/export/summary` - Export summary only
- `GET /api/analysis/stats` - Get analysis statistics
- `POST /api/analysis/text` - Analyze text content
- `GET /api/analysis/currencies` - Get supported currencies
- `GET /api/health` - Health check

## Usage

1. **Import Services**:
```typescript
import { uploadService, exportService, analysisService } from '@/services';
```

2. **Upload and Analyze**:
```typescript
await uploadService.uploadAndAnalyze(file, {
  currency: 'USD',
  onStatus: (message) => console.log(message),
  onComplete: (result) => console.log(result)
});
```

3. **Export Data**:
```typescript
await exportService.exportByType(analysisData, 'complete');
```

4. **Format Currency**:
```typescript
const formatted = analysisService.formatCurrency(1000, 'USD');
```

This migration provides a complete backend integration that maintains the UI design while adding real functionality for bank statement analysis.