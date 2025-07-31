import { BarChart3, Radio, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const HomePage = () => {
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

      {/* Streaming Analysis Promotion */}
      <div className="card mb-8 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Radio className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Your Bank Statement PDF
              </h3>
              <p className="text-gray-600">
                Experience real-time AI analysis by uploading your bank
                statement PDF and receive live updates.
              </p>
            </div>
          </div>
          <Link
            to="/streaming-analysis"
            className="btn-primary flex items-center space-x-2 flex-0 w-32"
          >
            <Radio className="h-4 w-4" />
            <span>Let's Go</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
