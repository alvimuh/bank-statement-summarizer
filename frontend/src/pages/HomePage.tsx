import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Shield, BarChart3, Zap, Globe } from "lucide-react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import axios from "axios";

interface AnalysisResult {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    period: string;
    accountNumber: string;
  };
  categories: Record<string, any>;
  allTransactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: "credit" | "debit";
    category: string;
  }>;
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderWidth: number;
    }>;
  };
  currency: string;
}

const currencies = [
  { code: "AUTO", name: "Auto-detect", symbol: "🔍" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "PLN", name: "Polish Złoty", symbol: "zł" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв" },
  { code: "HRK", name: "Croatian Kuna", symbol: "kn" },
  { code: "RSD", name: "Serbian Dinar", symbol: "дин" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴" },
  { code: "BYN", name: "Belarusian Ruble", symbol: "Br" },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸" },
  { code: "UZS", name: "Uzbekistani Som", symbol: "so'm" },
  { code: "KGS", name: "Kyrgyzstani Som", symbol: "с" },
  { code: "TJS", name: "Tajikistani Somoni", symbol: "ЅМ" },
  { code: "TMT", name: "Turkmenistani Manat", symbol: "T" },
  { code: "AZN", name: "Azerbaijani Manat", symbol: "₼" },
  { code: "GEL", name: "Georgian Lari", symbol: "₾" },
  { code: "AMD", name: "Armenian Dram", symbol: "֏" },
  { code: "GEL", name: "Georgian Lari", symbol: "₾" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "₨" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "₨" },
  { code: "MMK", name: "Myanmar Kyat", symbol: "K" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "EGP", name: "Egyptian Pound", symbol: "£" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK" },
  { code: "BWP", name: "Botswana Pula", symbol: "P" },
  { code: "NAD", name: "Namibian Dollar", symbol: "N$" },
  { code: "MUR", name: "Mauritian Rupee", symbol: "₨" },
  { code: "SCR", name: "Seychellois Rupee", symbol: "₨" },
  { code: "MVR", name: "Maldivian Rufiyaa", symbol: "Rf" },
  { code: "CUSTOM", name: "Custom Currency", symbol: "💱" },
];

const HomePage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [selectedCurrency, setSelectedCurrency] = useState("IDR");
  const [customCurrency, setCustomCurrency] = useState("");
  const navigate = useNavigate();

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("pdf", file);

    // Add currency if not auto-detect
    if (selectedCurrency !== "AUTO") {
      const currencyToSend =
        selectedCurrency === "CUSTOM" ? customCurrency : selectedCurrency;
      if (currencyToSend) {
        formData.append("currency", currencyToSend);
      }
    }

    try {
      const response = await axios.post(
        "http://localhost:3001/api/upload/analyze",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setAnalysisResult(response.data.data);
        toast.success("PDF analyzed successfully!");
        navigate("/analysis", {
          state: { analysisResult: response.data.data },
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to analyze PDF");
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
      },
      multiple: false,
    });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bank Statement Summarizer
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Upload your bank statement PDF and get instant AI-powered analysis
          with privacy protection
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="card text-center">
          <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Privacy-First</h3>
          <p className="text-gray-600">
            Your PDF is processed in memory and deleted immediately. No data is
            stored.
          </p>
        </div>

        <div className="card text-center">
          <Zap className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
          <p className="text-gray-600">
            Advanced AI analyzes your transactions and categorizes them
            automatically.
          </p>
        </div>

        <div className="card text-center">
          <BarChart3 className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Smart Insights</h3>
          <p className="text-gray-600">
            Get detailed charts and summaries of your spending patterns.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            Upload Your Bank Statement
          </h2>
          <p className="text-gray-600">
            Drag and drop your PDF file here, or click to browse
          </p>
        </div>

        {/* Currency Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Globe className="h-4 w-4 inline mr-2" />
            Currency (Optional)
          </label>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="input-field w-64"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name}
                </option>
              ))}
            </select>

            {selectedCurrency === "CUSTOM" && (
              <input
                type="text"
                placeholder="Enter 3-letter currency code (e.g., USD)"
                value={customCurrency}
                onChange={(e) =>
                  setCustomCurrency(e.target.value.toUpperCase())
                }
                className="input-field w-48"
                maxLength={3}
                pattern="[A-Z]{3}"
              />
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Choose "Auto-detect" to let AI determine the currency from your PDF,
            or select a specific currency
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? "dropzone-active" : ""} ${
            isDragReject ? "dropzone-reject" : ""
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
            {isUploading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Processing your PDF...</p>
              </div>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive
                    ? "Drop your PDF here"
                    : "Click to upload or drag and drop"}
                </p>
                <p className="text-sm text-gray-500">
                  PDF files only, max 10MB
                </p>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Privacy Notice</h4>
              <p className="text-sm text-blue-700">
                Your PDF file is processed securely in memory and immediately
                deleted. No files are stored on our servers. All analysis is
                performed locally and results are not saved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
