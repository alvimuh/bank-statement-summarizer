import api from './api';
import { AnalysisResult } from './uploadService';

export interface AnalysisStats {
  totalAnalyses: number;
  averageProcessingTime: number;
  supportedCurrencies: string[];
  lastUpdated: string;
}

export interface TextAnalysisRequest {
  text: string;
  currency?: string;
}

class AnalysisService {
  // Get analysis statistics
  async getStats(): Promise<AnalysisStats> {
    try {
      const response = await api.get('/analysis/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get analysis stats:', error);
      throw new Error('Failed to load analysis statistics');
    }
  }

  // Analyze text directly (without PDF upload)
  async analyzeText(request: TextAnalysisRequest): Promise<AnalysisResult> {
    try {
      const response = await api.post('/analysis/text', request);
      return response.data;
    } catch (error: any) {
      console.error('Text analysis failed:', error);
      throw new Error(error.response?.data?.message || 'Text analysis failed. Please try again.');
    }
  }

  // Get supported currencies
  async getSupportedCurrencies(): Promise<string[]> {
    try {
      const response = await api.get('/analysis/currencies');
      return response.data.currencies || [];
    } catch (error) {
      console.error('Failed to get supported currencies:', error);
      // Return default currencies if API fails
      return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'IDR', 'INR', 'KRW', 'ILS', 'CHF', 'SGD', 'HKD', 'NZD'];
    }
  }

  // Validate analysis result
  validateAnalysisResult(result: any): result is AnalysisResult {
    return (
      result &&
      typeof result === 'object' &&
      result.summary &&
      typeof result.summary.totalIncome === 'number' &&
      typeof result.summary.totalExpenses === 'number' &&
      typeof result.summary.netAmount === 'number' &&
      Array.isArray(result.allTransactions) &&
      result.chartData &&
      typeof result.currency === 'string'
    );
  }

  // Format currency amount
  formatCurrency(amount: number, currency: string = 'USD'): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback if currency is not supported
      return `${currency} ${amount.toLocaleString()}`;
    }
  }

  // Calculate analysis summary
  calculateSummary(transactions: Array<{
    amount: number;
    type: 'credit' | 'debit';
  }>) {
    const income = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = Math.abs(transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0));
    
    const netAmount = income - expenses;
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netAmount,
      transactionCount: transactions.length,
    };
  }

  // Group transactions by category
  groupByCategory(transactions: Array<{
    category: string;
    amount: number;
    type: 'credit' | 'debit';
  }>) {
    const categories: Record<string, { total: number; count: number; transactions: any[] }> = {};
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      
      if (!categories[category]) {
        categories[category] = {
          total: 0,
          count: 0,
          transactions: []
        };
      }
      
      categories[category].total += Math.abs(transaction.amount);
      categories[category].count += 1;
      categories[category].transactions.push(transaction);
    });
    
    return categories;
  }

  // Filter transactions
  filterTransactions(
    transactions: Array<any>,
    filters: {
      type?: 'credit' | 'debit' | 'all';
      category?: string;
      dateFrom?: string;
      dateTo?: string;
      minAmount?: number;
      maxAmount?: number;
      searchTerm?: string;
    }
  ) {
    return transactions.filter(transaction => {
      // Type filter
      if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) {
        return false;
      }
      
      // Category filter
      if (filters.category && transaction.category !== filters.category) {
        return false;
      }
      
      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const transactionDate = new Date(transaction.date);
        if (filters.dateFrom && transactionDate < new Date(filters.dateFrom)) {
          return false;
        }
        if (filters.dateTo && transactionDate > new Date(filters.dateTo)) {
          return false;
        }
      }
      
      // Amount range filter
      const amount = Math.abs(transaction.amount);
      if (filters.minAmount !== undefined && amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && amount > filters.maxAmount) {
        return false;
      }
      
      // Search term filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const description = transaction.description?.toLowerCase() || '';
        const category = transaction.category?.toLowerCase() || '';
        
        if (!description.includes(searchTerm) && !category.includes(searchTerm)) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Get the latest analysis result from local storage or API
  async getLatestAnalysis(): Promise<AnalysisResult | null> {
    try {
      // First try to get from API
      const response = await api.get('/analysis/latest');
      if (response.data && this.validateAnalysisResult(response.data)) {
        return response.data;
      }
      
      // If API fails or returns invalid data, try local storage
      const storedAnalysis = localStorage.getItem('latestAnalysis');
      if (storedAnalysis) {
        const parsedAnalysis = JSON.parse(storedAnalysis);
        if (this.validateAnalysisResult(parsedAnalysis)) {
          return parsedAnalysis;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get latest analysis:', error);
      
      // Try local storage as fallback
      try {
        const storedAnalysis = localStorage.getItem('latestAnalysis');
        if (storedAnalysis) {
          const parsedAnalysis = JSON.parse(storedAnalysis);
          if (this.validateAnalysisResult(parsedAnalysis)) {
            return parsedAnalysis;
          }
        }
      } catch (storageError) {
        console.error('Failed to get analysis from local storage:', storageError);
      }
      
      return null;
    }
  }
}

export default new AnalysisService();