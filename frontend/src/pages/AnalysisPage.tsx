import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  BarChart3,
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  Globe,
  FileDown,
  ChevronDown,
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

const currencies = {
  IDR: { symbol: "Rp", name: "Indonesian Rupiah" },
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  JPY: { symbol: "¥", name: "Japanese Yen" },
  CAD: { symbol: "C$", name: "Canadian Dollar" },
  AUD: { symbol: "A$", name: "Australian Dollar" },
  INR: { symbol: "₹", name: "Indian Rupee" },
  RUB: { symbol: "₽", name: "Russian Ruble" },
  KRW: { symbol: "₩", name: "South Korean Won" },
  ILS: { symbol: "₪", name: "Israeli Shekel" },
  CHF: { symbol: "CHF", name: "Swiss Franc" },
  SGD: { symbol: "S$", name: "Singapore Dollar" },
  HKD: { symbol: "HK$", name: "Hong Kong Dollar" },
  NZD: { symbol: "NZ$", name: "New Zealand Dollar" },
};

const AnalysisPage = () => {
  const location = useLocation();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">(
    "all"
  );
  const [exportOptions, setExportOptions] = useState<ExportOption[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (location.state?.analysisResult) {
      setAnalysisResult(location.state.analysisResult);
    }
    // Load export options
    loadExportOptions();
  }, [location.state]);

  const loadExportOptions = async () => {
    try {
      const options = await exportService.getExportOptions();
      setExportOptions(options);
    } catch (error) {
      console.error("Failed to load export options:", error);
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

  if (!analysisResult) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          No Analysis Data
        </h2>
        <p className="text-gray-600 mb-6">
          Please upload a bank statement to see the analysis.
        </p>
        <Link to="/" className="btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Upload Statement
        </Link>
      </div>
    );
  }

  const filteredTransactions = analysisResult.allTransactions.filter(
    (transaction) => {
      const matchesSearch =
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        filterType === "all" || transaction.type === filterType;
      return matchesSearch && matchesType;
    }
  );

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Expenses by Category",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            const currency =
              currencies[analysisResult.currency as keyof typeof currencies];
            const symbol = currency ? currency.symbol : analysisResult.currency;
            return symbol + value.toLocaleString();
          },
        },
      },
    },
  };

  const formatCurrency = (amount: number) => {
    const currency =
      currencies[analysisResult.currency as keyof typeof currencies];
    const symbol = currency ? currency.symbol : analysisResult.currency;

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: analysisResult.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const currencyInfo =
    currencies[analysisResult.currency as keyof typeof currencies];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/" className="btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
        </div>
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

          <button
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="btn-secondary"
          >
            {showSensitiveData ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {showSensitiveData ? "Hide" : "Show"} Sensitive Data
          </button>
        </div>
      </div>

      {/* Currency Information */}
      <div className="card mb-6">
        <div className="flex items-center space-x-3">
          <Globe className="h-5 w-5 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Currency:{" "}
              {currencyInfo ? currencyInfo.name : analysisResult.currency}
            </h3>
            <p className="text-sm text-gray-600">
              Symbol:{" "}
              {currencyInfo ? currencyInfo.symbol : analysisResult.currency}
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
          <h3 className="text-sm font-medium text-gray-500 mb-1">Net Amount</h3>
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
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Expense Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Expenses by Category</h2>
          <div className="h-80">
            <Bar
              data={analysisResult.chartData.expenseChart}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    display: true,
                    text: "Expenses by Category",
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Income Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Income by Category</h2>
          <div className="h-80">
            <Bar
              data={analysisResult.chartData.incomeChart}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    display: true,
                    text: "Income by Category",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">All Transactions</h2>
          <div className="flex items-center space-x-4">
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
          </div>
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
    </div>
  );
};

export default AnalysisPage;
