# Bank Statement Summarizer

A privacy-focused AI-powered application that analyzes bank statement PDFs and provides comprehensive financial insights with automatic currency detection.

## 🌟 Features

### 🔒 Privacy-First Design

- **In-Memory Processing**: PDFs are processed in memory and deleted immediately
- **No Data Storage**: No files or data are stored on servers
- **Secure Processing**: All analysis is performed locally with immediate cleanup

### 🤖 AI-Powered Analysis

- **Google Gemini AI**: Advanced AI for intelligent transaction categorization
- **Automatic Currency Detection**: AI detects currency from PDF content
- **Manual Currency Selection**: Users can manually select currency if needed
- **Fallback Mode**: Works even when AI quota is exceeded

### 📊 Comprehensive Analysis

- **Transaction Categorization**: Automatic categorization of expenses and income
- **Visual Charts**: Interactive charts showing spending by category
- **Detailed Tables**: Complete transaction history with search and filtering
- **Financial Summary**: Income, expenses, and net amount calculations

### 💰 Multi-Currency Support

- **15+ Currencies**: USD, EUR, GBP, JPY, CAD, AUD, INR, RUB, KRW, ILS, CHF, SGD, HKD, NZD
- **Auto-Detection**: AI automatically detects currency from PDF symbols
- **Proper Formatting**: Currency symbols and proper number formatting
- **Chart Integration**: Currency symbols displayed in charts and tables

### 📁 CSV Export

- **Complete Analysis**: Full analysis with summary, categories, and transactions
- **Transactions Only**: Just the transaction list with dates and amounts
- **Summary Only**: Summary and category breakdown without individual transactions
- **Automatic Filenames**: Timestamped files with currency information

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key (optional, fallback mode available)

### Installation

1. **Clone and Install**

```bash
git clone <repository-url>
cd bank-statement-summarizer
npm run install:all
```

2. **Environment Setup**

```bash
# Backend
cd backend
cp env.example .env
# Add your Gemini API key to .env (optional)
GEMINI_API_KEY=your_api_key_here
```

3. **Start Development Servers**

```bash
# From root directory
npm run dev
```

This starts:

- **Backend API**: http://localhost:3001
- **Frontend App**: http://localhost:3000

## 📋 API Endpoints

### Upload & Analysis

- `POST /api/upload/analyze` - Upload and analyze PDF
- `POST /api/upload/upload-only` - Upload PDF only (for testing)

### Analysis

- `GET /api/analysis/stats` - Get analysis statistics
- `POST /api/analysis/text` - Analyze text directly

### Export

- `POST /api/export/csv/complete` - Export complete analysis
- `POST /api/export/csv/transactions` - Export transactions only
- `POST /api/export/csv/summary` - Export summary only
- `GET /api/export/options` - Get available export options

### Health Check

- `GET /api/health` - API health status

## 🛠️ Development

### Project Structure

```
bank-statement-summarizer/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── index.js        # Main server file
│   └── package.json
├── frontend/               # React/Vite application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── main.tsx        # App entry point
│   └── package.json
└── package.json            # Monorepo configuration
```

### Available Scripts

#### Root (Monorepo)

```bash
npm run dev          # Start both frontend and backend
npm run build        # Build both applications
npm run start        # Start production servers
npm run install:all  # Install all dependencies
```

#### Backend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
```

#### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
```

### Currency Support

The application supports automatic currency detection and manual selection:

**Supported Currencies:**

- USD ($) - US Dollar
- EUR (€) - Euro
- GBP (£) - British Pound
- JPY (¥) - Japanese Yen
- CAD (C$) - Canadian Dollar
- AUD (A$) - Australian Dollar
- INR (₹) - Indian Rupee
- RUB (₽) - Russian Ruble
- KRW (₩) - South Korean Won
- ILS (₪) - Israeli Shekel
- CHF (CHF) - Swiss Franc
- SGD (S$) - Singapore Dollar
- HKD (HK$) - Hong Kong Dollar
- NZD (NZ$) - New Zealand Dollar

## 📊 Export Features

### CSV Export Options

1. **Complete Analysis**

   - Summary information
   - Category breakdown
   - All transactions with details
   - Filename: `complete_[CURRENCY]_[TIMESTAMP].csv`

2. **Transactions Only**

   - Just the transaction list
   - Date, description, category, type, amount
   - Filename: `transactions_[CURRENCY]_[TIMESTAMP].csv`

3. **Summary Only**
   - Financial summary
   - Category breakdown with averages
   - No individual transactions
   - Filename: `summary_[CURRENCY]_[TIMESTAMP].csv`

### Export Process

1. Click "Export CSV" button in analysis page
2. Select export type from dropdown
3. File downloads automatically with proper formatting
4. CSV includes currency information and proper escaping

## 🔒 Security Features

- **Rate Limiting**: API rate limiting to prevent abuse
- **File Size Limits**: 10MB maximum file size
- **File Type Validation**: Only PDF files accepted
- **Input Validation**: Comprehensive request validation
- **Security Headers**: Helmet.js for security headers
- **CORS Protection**: Configured CORS for frontend access

## 🐛 Troubleshooting

### Common Issues

1. **Backend won't start**

   ```bash
   # Check if port 3001 is in use
   lsof -ti:3001 | xargs kill -9
   # Restart backend
   cd backend && npm run dev
   ```

2. **Frontend won't start**

   ```bash
   # Check if port 3000 is in use
   lsof -ti:3000 | xargs kill -9
   # Restart frontend
   cd frontend && npm run dev
   ```

3. **AI Analysis fails**

   - Check Gemini API key in `.env`
   - Verify API quota hasn't been exceeded
   - Fallback mode will work without API key

4. **Currency detection issues**
   - Try manual currency selection
   - Check PDF quality and text extraction
   - Defaults to USD if detection fails

### Development Tips

- Use `npm run dev` from root for full development setup
- Check browser console and server logs for errors
- Test with different PDF formats and currencies
- Verify export functionality with various data types

## 📈 Performance

- **Fast Processing**: Optimized PDF parsing and AI analysis
- **Memory Efficient**: In-memory processing with immediate cleanup
- **Responsive UI**: React with Vite for fast development
- **Compression**: Response compression for faster API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Note**: This application prioritizes user privacy by processing PDFs in memory and deleting them immediately. No data is stored on servers.
