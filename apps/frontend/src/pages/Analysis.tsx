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
  FileText
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
  PieChart,
  Pie,
  Cell
} from "recharts";

// Mock data for demonstration
const mockTransactions = [
  { id: 1, date: "2024-01-15", description: "Salary Deposit", amount: 5000, type: "income", category: "Salary" },
  { id: 2, date: "2024-01-16", description: "Grocery Store", amount: -125.50, type: "expense", category: "Food" },
  { id: 3, date: "2024-01-17", description: "Gas Station", amount: -65.00, type: "expense", category: "Transportation" },
  { id: 4, date: "2024-01-18", description: "Netflix Subscription", amount: -15.99, type: "expense", category: "Entertainment" },
  { id: 5, date: "2024-01-19", description: "Freelance Payment", amount: 800, type: "income", category: "Freelance" },
  { id: 6, date: "2024-01-20", description: "Restaurant", amount: -85.25, type: "expense", category: "Food" },
  { id: 7, date: "2024-01-22", description: "Online Shopping", amount: -299.99, type: "expense", category: "Shopping" },
  { id: 8, date: "2024-01-25", description: "Rent Payment", amount: -1200, type: "expense", category: "Housing" },
];

const mockChartData = [
  { name: "Income", amount: 5800, color: "#22c55e" },
  { name: "Food", amount: -210.75, color: "#ef4444" },
  { name: "Housing", amount: -1200, color: "#f97316" },
  { name: "Transportation", amount: -65, color: "#eab308" },
  { name: "Shopping", amount: -299.99, color: "#8b5cf6" },
  { name: "Entertainment", amount: -15.99, color: "#06b6d4" },
];

const COLORS = ['#22c55e', '#ef4444', '#f97316', '#eab308', '#8b5cf6', '#06b6d4'];

export default function Analysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const fileName = location.state?.fileName || "bank-statement.pdf";

  useEffect(() => {
    // Simulate AI analysis progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const totalIncome = mockTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = Math.abs(mockTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0));

  const netAmount = totalIncome - totalExpenses;

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
                  Our AI is processing your bank statement to extract insights...
                </p>
              </div>

              <div className="space-y-4">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {progress < 30 && "Reading PDF content..."}
                  {progress >= 30 && progress < 60 && "Extracting transactions..."}
                  {progress >= 60 && progress < 90 && "Categorizing expenses..."}
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
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/upload")}>
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
                  ${totalIncome.toLocaleString()}
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
                  ${totalExpenses.toLocaleString()}
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
                <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${netAmount.toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                netAmount >= 0 ? 'bg-success/20' : 'bg-destructive/20'
              }`}>
                <DollarSign className={`w-6 h-6 ${netAmount >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-6">Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [`$${Math.abs(value).toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-6">Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockChartData.filter(d => d.amount < 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {mockChartData.filter(d => d.amount < 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${Math.abs(value).toLocaleString()}`, 'Amount']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </PieChart>
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
                  <th className="text-left py-3 px-4 font-semibold">Description</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-right py-3 px-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(transaction.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{transaction.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {transaction.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className={`flex items-center justify-end space-x-1 font-semibold ${
                        transaction.amount >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {transaction.amount >= 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        <span>${Math.abs(transaction.amount).toLocaleString()}</span>
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