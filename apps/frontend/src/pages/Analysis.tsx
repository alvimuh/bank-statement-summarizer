import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileText,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  analysisService,
  exportService,
  type AnalysisResult,
} from "@/services";
import { toast } from "@/hooks/use-toast";

// Default colors for charts
const COLORS = [
  "#22c55e",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
  "#f43f5e",
];

// Helper function to process category data for charts
const processCategoryData = (data: any, type: "income" | "expense") => {
  if (!data) return [];

  const isIncome = type === "income";

  // If we have chartData from the API
  if (data.chartData) {
    const chartData = isIncome
      ? data.chartData.incomeChart
      : data.chartData.expenseChart;
    if (
      chartData &&
      chartData.labels &&
      chartData.datasets &&
      chartData.datasets[0]?.data
    ) {
      return chartData.labels.map((label: string, index: number) => ({
        name: label,
        amount: chartData.datasets[0].data[index],
        color:
          chartData.datasets[0].backgroundColor?.[index] ||
          COLORS[index % COLORS.length],
      }));
    }
  }

  return [];
};

export default function Analysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [currency, setCurrency] = useState<string>("USD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("$");

  const fileName = location.state?.fileName || "bank-statement.pdf";

  // Process data from location state or fetch from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if we have data from the upload page
        if (location.state?.analysisResult) {
          setAnalysisData(location.state.analysisResult);
          console.log("Currency:", location.state);
          if (location.state.currency) {
            setCurrency(location.state.currency);
          }
          if (location.state.currencySymbol) {
            setCurrencySymbol(location.state.currencySymbol);
          }
          setIsLoading(false);
          return;
        }

        // If no data in location state, try to fetch the latest analysis
        // This is a fallback in case user navigates directly to this page
        const result = await analysisService.getLatestAnalysis();

        if (result) {
          setAnalysisData(result);
          // Set default currency if not provided
          setCurrency(result.currency || "USD");

          // Set currency symbol from result or determine based on currency
          if (result.currencySymbol) {
            setCurrencySymbol(result.currencySymbol);
          } else {
            // Default currency symbols based on common currencies
            const currencySymbols: Record<string, string> = {
              USD: "$",
              EUR: "€",
              GBP: "£",
              JPY: "¥",
              IDR: "Rp",
              INR: "₹",
              KRW: "₩",
              ILS: "₪",
              CHF: "CHF",
              SGD: "S$",
              HKD: "HK$",
              NZD: "NZ$",
              CAD: "C$",
              AUD: "A$",
            };
            setCurrencySymbol(
              currencySymbols[result.currency] || result.currency
            );
          }

          setIsLoading(false);
        } else {
          // No analysis data available, redirect to upload
          toast({
            title: "No analysis data found",
            description: "Please upload a statement to analyze",
            variant: "destructive",
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching analysis data:", error);
        toast({
          title: "Error loading analysis",
          description: "There was a problem loading your analysis data",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    // Simulate loading progress while fetching data
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    fetchData();

    return () => clearInterval(interval);
  }, [location.state, navigate]);

  // Calculate totals from analysis data
  const totalIncome = analysisData?.summary?.totalIncome || 0;
  const totalExpenses = analysisData?.summary?.totalExpenses || 0;
  const netAmount =
    analysisData?.summary?.netAmount || totalIncome - totalExpenses;

  // Process transactions data
  const transactions = analysisData?.allTransactions || [];

  // Process chart data
  const incomeChartData = processCategoryData(analysisData, "income");
  const expenseChartData = processCategoryData(analysisData, "expense");

  // Handle export functions
  const handleExport = async (
    type: "complete" | "transactions" | "summary"
  ) => {
    if (!analysisData) return;

    try {
      await exportService.exportByType(type, {
        summary: analysisData.summary,
        allTransactions: analysisData.allTransactions,
        chartData: analysisData.chartData,
        categories: analysisData.categories || [], // Add required categories property
        currency: currency,
      });

      toast({
        title: "Export successful",
        description: `Your ${type} data has been exported successfully`,
      });
    } catch (error) {
      console.error(`Error exporting ${type} data:`, error);
      toast({
        title: "Export failed",
        description: `There was a problem exporting your ${type} data`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <GlassCard className="p-12 text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-primary rounded-full mx-auto flex items-center justify-center animate-pulse-glow">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold">Analyzing Your Statement</h2>
                <p className="text-lg text-muted-foreground">
                  Our AI is processing your bank statement to extract
                  insights...
                </p>
              </div>

              <div className="space-y-4">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {progress < 30 && "Reading PDF content..."}
                  {progress >= 30 &&
                    progress < 60 &&
                    "Extracting transactions..."}
                  {progress >= 60 &&
                    progress < 90 &&
                    "Categorizing expenses..."}
                  {progress >= 90 && "Generating insights..."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span>Secure Processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span>AI Analysis</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Financial Analysis</h1>
              <p className="text-muted-foreground">Analysis for {fileName}</p>
            </div>
            <div className="flex space-x-2">
              <div className="relative group">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport("complete")}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                    >
                      Complete Analysis
                    </button>
                    <button
                      onClick={() => handleExport("transactions")}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                    >
                      Transactions Only
                    </button>
                    <button
                      onClick={() => handleExport("summary")}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                    >
                      Summary Only
                    </button>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/upload")}
              >
                <FileText className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 animate-slide-up">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-success">
                  {currencySymbol}
                  {totalIncome.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">
                  {currencySymbol}
                  {totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-destructive/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Amount</p>
                <p
                  className={`text-2xl font-bold ${
                    netAmount >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {currencySymbol}
                  {netAmount.toLocaleString()}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  netAmount >= 0 ? "bg-success/20" : "bg-destructive/20"
                }`}
              >
                <DollarSign
                  className={`w-6 h-6 ${
                    netAmount >= 0 ? "text-success" : "text-destructive"
                  }`}
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-6">Expense Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={(value: number) =>
                    `${currencySymbol}${value.toLocaleString()}`
                  }
                  width={112}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  cursor={false}
                  formatter={(value: number) => [
                    `${currencySymbol}${Math.abs(value).toLocaleString()}`,
                    "Amount",
                  ]}
                />
                <Bar
                  dataKey="amount"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-6">Income Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "hsl(var(--foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{
                    fill: "hsl(var(--foreground))",
                  }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={(value: number) =>
                    `${currencySymbol}${value.toLocaleString()}`
                  }
                  width={112}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  cursor={false}
                  formatter={(value: number) => [
                    `${currencySymbol}${Math.abs(value).toLocaleString()}`,
                    "Amount",
                  ]}
                />
                <Bar
                  dataKey="amount"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Transactions Table */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold mb-6">All Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Category
                  </th>
                  <th className="text-right py-3 px-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr
                    key={index}
                    className="border-b border-border/50 hover:bg-muted/20"
                  >
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {new Date(transaction.date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        {transaction.description}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {transaction.category || "Uncategorized"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div
                        className={`flex items-center justify-end space-x-1 font-medium ${
                          transaction.type === "credit"
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {transaction.type === "credit" ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                        <span>
                          {currencySymbol}{" "}
                          {Math.abs(
                            Number(transaction.amount)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
