import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  ArrowLeft,
  FileText,
  CheckCircle,
  Loader,
  Eye,
  EyeOff,
  Globe,
  FileDown,
  ChevronDown,
  X,
  BanknoteIcon,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { format } from "date-fns";
import toast from "react-hot-toast";
import exportService, {
  AnalysisData,
  ExportOption,
} from "../services/exportService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
    expenseChart: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string[];
        borderWidth: number;
      }>;
    };
    incomeChart: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string[];
        borderWidth: number;
      }>;
    };
  };
  currency: string;
}

interface StreamingStatus {
  type: "status" | "analysis_chunk" | "complete" | "error";
  message?: string;
  content?: string;
  data?: AnalysisResult;
}

const currencies = {
  IDR: { symbol: "Rp", name: "Indonesian Rupiah" },
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  JPY: { symbol: "¥", name: "Japanese Yen" },
  CAD: { symbol: "C$", name: "Canadian Dollar" },
  AUD: { symbol: "A$", name: "Australian Dollar" },
  INR: { symbol: "₹", name: "Indian Rupee" },
  KRW: { symbol: "₩", name: "South Korean Won" },
  ILS: { symbol: "₪", name: "Israeli Shekel" },
  CHF: { symbol: "CHF", name: "Swiss Franc" },
  SGD: { symbol: "S$", name: "Singapore Dollar" },
  HKD: { symbol: "HK$", name: "Hong Kong Dollar" },
  NZD: { symbol: "NZ$", name: "New Zealand Dollar" },
};

const StreamingAnalysisPage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [analysisChunks, setAnalysisChunks] = useState<string[]>([]);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">(
    "all"
  );
  const [exportOptions, setExportOptions] = useState<ExportOption[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [canCancel, setCanCancel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadExportOptions();
  }, []);

  const loadExportOptions = async () => {
    try {
      const options = await exportService.getExportOptions();
      setExportOptions(options);
    } catch (error) {
      console.error("Failed to load export options:", error);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsUploading(false);
    setIsAnalyzing(false);
    setCanCancel(false);
    toast.success("Analysis cancelled");
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    setIsUploading(true);
    setIsAnalyzing(true);
    setStatusMessages([]);
    setAnalysisChunks([]);
    setAnalysisResult(null);
    setCanCancel(true);

    const formData = new FormData();
    formData.append("pdf", file);
    if (selectedCurrency) {
      formData.append("currency", selectedCurrency);
    }

    // Add timeout for the request
    const timeoutId = setTimeout(() => {
      toast.error("Request timed out. Please try again.");
      setIsUploading(false);
      setIsAnalyzing(false);
      setCanCancel(false);
    }, 120000); // 2 minutes timeout

    try {
      // Close any existing EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Create new EventSource for streaming
      const response = await fetch(
        "http://localhost:3003/api/upload/analyze-v2",
        {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log("Received streaming data:", data);
              handleStreamingData(data);
            } catch (error) {
              console.error("Error parsing streaming data:", error);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request was cancelled");
      } else {
        console.error("Upload error:", error);
        toast.error("Upload failed. Please try again.");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsUploading(false);
      setCanCancel(false);
      // Don't reset isAnalyzing here as it should be reset by the complete/error events
    }
  };

  const handleMockRequest = async () => {
    setIsUploading(true);
    setIsAnalyzing(false); // Start with just uploading
    setStatusMessages([]);
    setAnalysisChunks([]);
    setAnalysisResult(null);
    setCanCancel(true);

    // Add timeout for the request
    const timeoutId = setTimeout(() => {
      toast.error("Request timed out. Please try again.");
      setIsUploading(false);
      setIsAnalyzing(false);
      setCanCancel(false);
    }, 120000); // 2 minutes timeout

    try {
      // Close any existing EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Call the mock API endpoint
      const response = await fetch(
        "http://localhost:3003/api/upload/analyze-mock",
        {
          method: "POST",
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Transition to analyzing phase once we get a response
      setIsUploading(false);
      setIsAnalyzing(true);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log("Received streaming data:", data);
              handleStreamingData(data);
            } catch (error) {
              console.error("Error parsing streaming data:", error);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request was cancelled");
      } else {
        console.error("Upload error:", error);
        toast.error("Upload failed. Please try again.");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsUploading(false);
      setCanCancel(false);
      // Don't reset isAnalyzing here as it should be reset by the complete/error events
    }
  };

  const handleStreamingData = (data: StreamingStatus) => {
    console.log("Streaming data...", data);
    switch (data.type) {
      case "status":
        if (data.message) {
          setStatusMessages((prev) => [...prev, data.message!]);
        }
        break;
      case "analysis_chunk":
        if (data.content) {
          setAnalysisChunks((prev) => [...prev, data.content!]);
        }
        break;
      case "complete":
        if (data.data) {
          setAnalysisResult(data.data);
          setIsAnalyzing(false);
          setIsUploading(false);
          toast.success("Analysis completed successfully!");
        }
        break;
      case "error":
        if (data.message) {
          toast.error(data.message);
          setIsAnalyzing(false);
          setIsUploading(false);
        }
        break;
    }
  };

  const handleExport = async (exportType: string) => {
    if (!analysisResult) return;

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      await exportService.exportByType(
        exportType,
        analysisResult as AnalysisData
      );
      toast.success("Export completed successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: analysisResult?.currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const filteredTransactions =
    analysisResult?.allTransactions.filter((transaction) => {
      const matchesSearch =
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        filterType === "all" || transaction.type === filterType;
      return matchesSearch && matchesType;
    }) || [];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: "Expenses by Category",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            const currency =
              currencies[analysisResult?.currency as keyof typeof currencies];
            return (
              (currency ? currency.symbol : analysisResult?.currency) +
              value.toLocaleString()
            );
          },
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    elements: {
      bar: {
        borderRadius: 4,
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col  space-y-8">
      <Link to="/" className="btn-secondary flex items-center text-sm w-fit">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>

      {!analysisResult && !isUploading && !isAnalyzing && (
        <div className="card">
          <div className="text-center py-8">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Upload Bank Statement
            </h2>
            <p className="text-gray-600 mb-6">
              Upload your PDF bank statement for real-time streaming analysis.
            </p>

            {/* Currency Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency (Optional - will auto-detect if not specified)
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="input-field w-64"
              >
                <option value="">Auto-detect</option>
                {Object.entries(currencies).map(([code, info]) => (
                  <option key={code} value={code}>
                    {code} - {info.name}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isAnalyzing}
                className="btn-primary flex items-center mx-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading || isAnalyzing
                  ? "Processing..."
                  : "Select PDF File"}
              </button>
            </div>
            <button
              onClick={handleMockRequest}
              disabled={isUploading || isAnalyzing}
              className="btn-secondary flex items-center"
            >
              <span className="mr-2">🧪</span>
              Test Mock Data
            </button>
          </div>
        </div>
      )}

      {/* Streaming Status */}
      {(isUploading || isAnalyzing) && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Loader className="h-5 w-5 text-primary-600 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900">
                {isUploading ? "Uploading PDF..." : "Processing Analysis"}
              </h3>
            </div>
            {canCancel && (
              <button
                onClick={handleCancel}
                className="btn-secondary flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  isUploading || isAnalyzing ? "bg-blue-600" : "bg-green-600"
                }`}
                style={{
                  width: `${
                    isUploading && !isAnalyzing
                      ? "25%"
                      : isAnalyzing && statusMessages.length > 0
                      ? Math.min(25 + statusMessages.length * 8, 90)
                      : isAnalyzing
                      ? "25%"
                      : "100%"
                  }`,
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>
                {isUploading && !isAnalyzing
                  ? "25%"
                  : isAnalyzing && statusMessages.length > 0
                  ? Math.min(25 + statusMessages.length * 8, 90)
                  : isAnalyzing
                  ? "25%"
                  : "100%"}
                %
              </span>
              <span>100%</span>
            </div>
          </div>

          {/* Status Messages */}
          {statusMessages.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Processing Steps:
              </h4>
              <div className="space-y-2">
                {statusMessages.map((message, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-success-600" />
                    <span className="text-sm text-gray-600">{message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Status */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 p-4 bg-blue-100 rounded-lg">
              <Loader className="size-6 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-700">
                {analysisChunks.length > 0
                  ? analysisChunks
                      .filter((chunk) => /^[🤔📊🔍💰📈🏷️📋⚡✅]/.test(chunk))
                      .slice(-1)[0] || "AI is thinking..."
                  : statusMessages.length > 0
                  ? statusMessages[statusMessages.length - 1]
                  : "Starting analysis..."}
              </span>
            </div>

            {analysisChunks.length > 0 && (
              <div
                className="mt-2 pt-2 border-blue-200 whitespace-pre-line font-mono max-h-40 overflow-y-auto text-xs"
                ref={(el) => {
                  if (el) el.scrollTop = el.scrollHeight;
                }}
              >
                {analysisChunks.join("\n")}
              </div>
            )}
          </div>

          {/* Analysis Chunks */}
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Analysis Results
            </h2>
            <div className="flex items-center space-x-2">
              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting}
                  className="btn-primary flex items-center space-x-2"
                >
                  <FileDown className="h-4 w-4" />
                  <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-2">
                      {exportOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleExport(option.id)}
                          disabled={isExporting}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <div className="font-medium">{option.name}</div>
                          <div className="text-xs text-gray-500">
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Currency Information */}
          <div className="card mb-6">
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Currency:{" "}
                  {currencies[
                    analysisResult.currency as keyof typeof currencies
                  ]?.name || analysisResult.currency}
                </h3>
                <p className="text-sm text-gray-600">
                  Symbol:{" "}
                  {currencies[
                    analysisResult.currency as keyof typeof currencies
                  ]?.symbol || analysisResult.currency}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Period</h3>
              <p className="text-2xl font-bold text-gray-900">
                {analysisResult.summary.period}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Total Income
              </h3>
              <p className="text-2xl font-bold text-success-600">
                {formatCurrency(analysisResult.summary.totalIncome)}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Total Expenses
              </h3>
              <p className="text-2xl font-bold text-error-600">
                {formatCurrency(analysisResult.summary.totalExpenses)}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Net Amount
              </h3>
              <p
                className={`text-2xl font-bold ${
                  analysisResult.summary.netAmount >= 0
                    ? "text-success-600"
                    : "text-error-600"
                }`}
              >
                {formatCurrency(analysisResult.summary.netAmount)}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="w-full">
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Expense Chart */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">
                  Expenses by Category
                </h2>
                <div className="relative w-full h-80 sm:h-96 lg:h-80 xl:h-96">
                  <Bar
                    data={analysisResult.chartData.expenseChart}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          display: true,
                          text: "Expenses by Category",
                          font: {
                            size: 16,
                            weight: "bold" as const,
                          },
                          padding: {
                            top: 10,
                            bottom: 20,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Income Chart */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">
                  Income by Category
                </h2>
                <div className="relative w-full h-80 sm:h-96 lg:h-80 xl:h-96">
                  <Bar
                    data={analysisResult.chartData.incomeChart}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          display: true,
                          text: "Income by Category",
                          font: {
                            size: 16,
                            weight: "bold" as const,
                          },
                          padding: {
                            top: 10,
                            bottom: 20,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="card">
            <div className="flex md:items-center justify-between mb-6 md:space-x-4 flex-col md:flex-row space-y-4 md:space-y-0">
              <h2 className="text-xl font-semibold flex-1">All Transactions</h2>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-64"
              />
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as "all" | "credit" | "debit")
                }
                className="input-field w-32"
              >
                <option value="all">All</option>
                <option value="credit">Income</option>
                <option value="debit">Expenses</option>
              </select>
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="btn-secondary flex items-center text-sm"
              >
                {showSensitiveData ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {showSensitiveData ? "Hide" : "Show"} Sensitive Data
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Category
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">
                      Amount
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {format(new Date(transaction.date), "MMM dd, yyyy")}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {showSensitiveData ? transaction.description : "***"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium">
                        <span
                          className={
                            transaction.type === "credit"
                              ? "text-success-600"
                              : "text-error-600"
                          }
                        >
                          {transaction.type === "credit" ? "+" : "-"}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === "credit"
                              ? "bg-success-100 text-success-800"
                              : "bg-error-100 text-error-800"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No transactions found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StreamingAnalysisPage;
