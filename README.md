# Bank Statement Summarizer

A full-stack application that analyzes bank statements using AI to provide financial insights, categorize transactions, and generate visualizations.

## Project Structure

This project is organized as a monorepo with the following components:

```
/
├── apps/
│   ├── backend/       # Express.js API server
│   └── frontend/      # React.js frontend application
├── frontend/         # Legacy frontend (to be deprecated)
└── supabase/
    └── functions/
        └── node-api/  # Supabase Edge Function for PDF analysis
```

## Features

- **PDF Bank Statement Upload**: Upload your bank statement in PDF format
- **AI-Powered Analysis**: Intelligent analysis of transactions using Google's Gemini AI
- **Transaction Categorization**: Automatic categorization of income and expenses
- **Financial Dashboard**: Interactive dashboard with summary statistics
- **Data Visualization**: Charts and graphs for financial insights
- **Export Functionality**: Export analysis results to CSV
- **Demo Mode**: Try the application with sample data
- **Real-time Progress Updates**: Stream analysis progress in real-time

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd apps/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment variables:
   ```bash
   cp env.example .env
   ```

4. Update the `.env` file with your configuration, including your Gemini API key

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd apps/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Update the `.env.local` file with your configuration

5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Backend Deployment Options

#### Option 1: Vercel Deployment
The Express.js backend can be deployed to Vercel. See [VERCEL_DEPLOYMENT.md](./apps/backend/VERCEL_DEPLOYMENT.md) for detailed instructions.

#### Option 2: Supabase Edge Function
The PDF analysis functionality is also available as a Supabase Edge Function. See [README.md](./supabase/functions/node-api/README.md) for deployment and usage instructions.

### Migration Between Backend Options

To migrate from the Express.js backend to the Supabase Edge Function, see [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for step-by-step instructions.

### Frontend Deployment

The frontend can be deployed to Netlify. See [NETLIFY_DEPLOYMENT.md](./apps/frontend/NETLIFY_DEPLOYMENT.md) for detailed instructions.

## Technologies Used

### Backend
- Express.js
- Google Generative AI (Gemini)
- pdf-parse
- Tesseract.js (OCR)
- Multer
- Supabase Edge Functions

### Frontend
- React.js
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- Recharts

## License

MIT
