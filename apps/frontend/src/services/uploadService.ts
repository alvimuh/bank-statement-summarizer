import api from './api';

export interface AnalysisResult {
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
  currencySymbol?: string;
}

export interface StreamingStatus {
  type: "status" | "analysis_chunk" | "complete" | "error";
  message?: string;
  content?: string;
  data?: AnalysisResult;
}

export interface UploadOptions {
  currency?: string;
  onStatus?: (message: string) => void;
  onAnalysisChunk?: (content: string) => void;
  onComplete?: (result: AnalysisResult) => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
}

class UploadService {
  // Upload PDF and get streaming analysis
  async uploadAndAnalyze(file: File, options: UploadOptions = {}): Promise<void> {
    const formData = new FormData();
    formData.append('pdf', file);
    
    if (options.currency) {
      formData.append('currency', options.currency);
    }

    try {
      const response = await fetch(`${api.defaults.baseURL}/upload/analyze-v2`, {
        method: 'POST',
        body: formData,
        signal: options.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamingStatus = JSON.parse(line.slice(6));
              this.handleStreamingData(data, options);
            } catch (error) {
              console.error('Error parsing streaming data:', error);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
      } else {
        console.error('Upload error:', error);
        options.onError?.(error.message || 'Upload failed. Please try again.');
        throw error;
      }
    }
  }

  // Upload PDF for mock analysis (for testing)
  async uploadMockAnalysis(options: UploadOptions = {}): Promise<void> {
    try {
      const response = await fetch(`${api.defaults.baseURL}/upload/analyze-mock`, {
        method: 'POST',
        signal: options.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamingStatus = JSON.parse(line.slice(6));
              this.handleStreamingData(data, options);
            } catch (error) {
              console.error('Error parsing streaming data:', error);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
      } else {
        console.error('Mock analysis error:', error);
        options.onError?.(error.message || 'Analysis failed. Please try again.');
        throw error;
      }
    }
  }

  // Handle streaming data from server
  private handleStreamingData(data: StreamingStatus, options: UploadOptions): void {
    console.log('Streaming data:', data);
    
    switch (data.type) {
      case 'status':
        if (data.message) {
          options.onStatus?.(data.message);
        }
        break;
      case 'analysis_chunk':
        if (data.content) {
          options.onAnalysisChunk?.(data.content);
        }
        break;
      case 'complete':
        if (data.data) {
          options.onComplete?.(data.data);
        }
        break;
      case 'error':
        if (data.message) {
          options.onError?.(data.message);
        }
        break;
    }
  }

  // Simple upload without streaming (for basic analysis)
  async uploadFile(file: File, currency?: string): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('pdf', file);
    
    if (currency) {
      formData.append('currency', currency);
    }

    try {
      const response = await api.post('/upload/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes
      });

      return response.data;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(error.response?.data?.message || 'Upload failed. Please try again.');
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await api.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export default new UploadService();