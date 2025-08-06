import api from './api';

export interface AnalysisData {
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

export interface ExportOption {
  id: string;
  name: string;
  description: string;
  filename: string;
}

class ExportService {
  // Get available export options
  async getExportOptions(): Promise<ExportOption[]> {
    try {
      const response = await api.get('/export/options');
      return response.data.exportOptions;
    } catch (error) {
      console.error('Failed to get export options:', error);
      throw new Error('Failed to load export options');
    }
  }

  // Export complete analysis to CSV
  async exportComplete(analysisData: AnalysisData): Promise<void> {
    try {
      const response = await api.post(
        '/export/csv/complete',
        { analysisData },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      this.downloadFile(
        response.data,
        `complete_${analysisData.currency}_${this.getTimestamp()}.csv`
      );
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export complete analysis');
    }
  }

  // Export only transactions to CSV
  async exportTransactions(analysisData: AnalysisData): Promise<void> {
    try {
      const response = await api.post(
        '/export/csv/transactions',
        { analysisData },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      this.downloadFile(
        response.data,
        `transactions_${analysisData.currency}_${this.getTimestamp()}.csv`
      );
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export transactions');
    }
  }

  // Export summary to CSV
  async exportSummary(analysisData: AnalysisData): Promise<void> {
    try {
      const response = await api.post(
        '/export/csv/summary',
        { analysisData },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      this.downloadFile(
        response.data,
        `summary_${analysisData.currency}_${this.getTimestamp()}.csv`
      );
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export summary');
    }
  }

  // Helper method to download file
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Helper method to generate timestamp
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace(/:/g, '-');
  }

  // Export based on type
  async exportByType(type: string, analysisData: AnalysisData): Promise<void> {
    switch (type) {
      case 'complete':
        await this.exportComplete(analysisData);
        break;
      case 'transactions':
        await this.exportTransactions(analysisData);
        break;
      case 'summary':
        await this.exportSummary(analysisData);
        break;
      default:
        throw new Error('Invalid export type');
    }
  }
}

export default new ExportService();