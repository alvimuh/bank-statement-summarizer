# Bank Statement Summarizer - Final Setup Guide

## 🎉 Setup Complete!

Your bank statement PDF summarizer application has been successfully created with the following structure:

```
bank-statement-summarizer/
├── backend/          # Node.js/Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── index.js
│   ├── package.json
│   └── env.example
├── frontend/         # React/Vite application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── shared/           # Shared utilities (future)
├── package.json      # Root monorepo config
└── README.md
```

## 🚀 Quick Start

### 1. Set up Environment Variables

Create a `.env` file in the backend directory:

```bash
cd backend
cp env.example .env
```

Edit `backend/.env` and add your Google Gemini API key:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
```

### 2. Start the Application

From the root directory:

```bash
# Install all dependencies (if not already done)
npm run install:all

# Start both backend and frontend
npm run dev
```

This will start:

- **Backend API**: http://localhost:3001
- **Frontend App**: http://localhost:3000

### 3. Test the Application

1. Open http://localhost:3000 in your browser
2. Upload a PDF bank statement
3. View the AI-powered analysis with charts and transaction details

## 🔧 Development Commands

```bash
# Root level commands
npm run dev              # Start both backend and frontend
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend
npm run build            # Build both applications
npm run install:all      # Install all dependencies

# Backend only
cd backend
npm run dev              # Start with nodemon
npm run start            # Start production server

# Frontend only
cd frontend
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

## 🛡️ Privacy Features

- **No Data Storage**: PDFs are processed in memory and immediately deleted
- **Secure Processing**: All analysis is performed locally with no data persistence
- **Privacy Protection**: Sensitive transaction details can be hidden/shown as needed
- **File Validation**: Only PDF files accepted with size limits
- **Rate Limiting**: Protection against abuse

## 📊 Features

- **PDF Processing**: Supports various bank statement formats with OCR fallback
- **AI Analysis**: Automatic transaction categorization using Google Gemini AI
- **Interactive Charts**: Visual representation of spending patterns
- **Transaction Table**: Complete transaction history with search and filtering
- **Privacy Controls**: Toggle sensitive data visibility

## 🔒 Security

- File validation (PDF only, 10MB max)
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Security headers (Helmet.js)
- Input validation
- Memory-only processing

## 📝 API Endpoints

- `GET /api/health` - Health check
- `POST /api/upload/analyze` - Upload PDF and get analysis
- `POST /api/upload/upload-only` - Upload PDF only (testing)
- `GET /api/analysis/stats` - Analysis statistics
- `POST /api/analysis/text` - Analyze text directly

## 🎯 Next Steps

1. **Get Google Gemini API Key**: Sign up at https://makersuite.google.com/app/apikey
2. **Add API Key**: Update `backend/.env` with your key
3. **Start Development**: Run `npm run dev`
4. **Test with PDF**: Upload a bank statement PDF
5. **Customize**: Modify the AI prompts or add new features

## 🐛 Troubleshooting

### Backend Issues

- Ensure Gemini API key is set in `backend/.env`
- Check if port 3001 is available
- Verify all dependencies are installed

### Frontend Issues

- Check if port 3000 is available
- Ensure backend is running on port 3001
- Clear browser cache if needed

### PDF Processing Issues

- Ensure PDF is not password protected
- Check file size (max 10MB)
- Try different PDF formats if OCR fails

### AI Analysis Issues

- Verify Gemini API key is valid
- Check API quota limits
- Fallback mode will work without API key

## 📚 Tech Stack

### Backend

- Node.js with Express
- PDF Processing: pdf-parse, Tesseract.js (OCR)
- AI Integration: Google Gemini AI
- Security: Helmet, CORS, Rate Limiting

### Frontend

- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Chart.js for data visualization
- React Router for navigation

## 🎉 Ready to Use!

Your bank statement summarizer is now ready for development and testing. The application provides a privacy-focused way to analyze bank statements with AI-powered insights and beautiful visualizations.
