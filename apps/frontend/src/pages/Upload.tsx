import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Navigation } from "@/components/navigation";
import {
  Upload as UploadIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import uploadIcon from "@/assets/upload-icon.png";
import { uploadService, type AnalysisResult } from "@/services";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [analysisChunks, setAnalysisChunks] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [canCancel, setCanCancel] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for demo mode from URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isDemo = searchParams.get("demo") === "true";

    if (isDemo) {
      startDemoAnalysis();
    }
  }, [location]);

  const handleFile = useCallback(
    (selectedFile: File) => {
      if (selectedFile.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
        });
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      toast({
        title: "File uploaded successfully",
        description: `${selectedFile.name} is ready for analysis.`,
      });
    },
    [toast]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsUploading(false);
    setIsAnalyzing(false);
    setCanCancel(false);
    setStatusMessages([]);
    setAnalysisChunks([]);
    toast({
      title: "Analysis cancelled",
      description: "The analysis has been cancelled.",
    });
  };

  const startDemoAnalysis = async () => {
    setIsUploading(true);
    setIsAnalyzing(true);
    setStatusMessages([]);
    setAnalysisChunks([]);
    setCanCancel(true);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      await uploadService.uploadMockAnalysis({
        signal: abortControllerRef.current.signal,
        onStatus: (message: string) => {
          setStatusMessages((prev) => [...prev, message]);
        },
        onAnalysisChunk: (content: string) => {
          setAnalysisChunks((prev) => [...prev, content]);
        },
        onComplete: (result: AnalysisResult) => {
          setIsUploading(false);
          setIsAnalyzing(false);
          setCanCancel(false);
          toast({
            title: "Demo analysis completed",
            description:
              "The demo bank statement has been analyzed successfully.",
          });

          // Save analysis result to localStorage for later retrieval
          try {
            localStorage.setItem("latestAnalysis", JSON.stringify(result));
          } catch (error) {
            console.error("Failed to save analysis to localStorage:", error);
          }

          // Navigate to analysis page with demo data
          navigate("/analysis", {
            state: {
              fileName: "demo_bank_statement.pdf",
              analysisResult: result,
              currency: result.currency,
              currencySymbol: result.currencySymbol,
              isDemo: true,
            },
          });
        },
        onError: (error: string) => {
          setIsUploading(false);
          setIsAnalyzing(false);
          setCanCancel(false);
          toast({
            title: "Demo analysis failed",
            description: error,
            variant: "destructive",
          });
        },
      });
    } catch (error: any) {
      if (error.name !== "AbortError") {
        setIsUploading(false);
        setIsAnalyzing(false);
        setCanCancel(false);
        toast({
          title: "Demo failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleAnalysis = async () => {
    if (!file) return;

    setIsUploading(true);
    setIsAnalyzing(true);
    setStatusMessages([]);
    setAnalysisChunks([]);
    setCanCancel(true);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      await uploadService.uploadAndAnalyze(file, {
        currency: selectedCurrency || undefined,
        signal: abortControllerRef.current.signal,
        onStatus: (message: string) => {
          setStatusMessages((prev) => [...prev, message]);
        },
        onAnalysisChunk: (content: string) => {
          setAnalysisChunks((prev) => [...prev, content]);
        },
        onComplete: (result: AnalysisResult) => {
          setIsUploading(false);
          setIsAnalyzing(false);
          setCanCancel(false);
          toast({
            title: "Analysis completed",
            description: "Your bank statement has been analyzed successfully.",
          });

          // Save analysis result to localStorage for later retrieval
          try {
            localStorage.setItem("latestAnalysis", JSON.stringify(result));
          } catch (error) {
            console.error("Failed to save analysis to localStorage:", error);
          }

          // Navigate to analysis page with real data
          navigate("/analysis", {
            state: {
              fileName: file.name,
              analysisResult: result,
              currency: selectedCurrency || "USD",
              currencySymbol: selectedCurrency
                ? currencies[selectedCurrency as keyof typeof currencies]
                    ?.symbol
                : "$",
            },
          });
        },
        onError: (error: string) => {
          setIsUploading(false);
          setIsAnalyzing(false);
          setCanCancel(false);
          toast({
            title: "Analysis failed",
            description: error,
            variant: "destructive",
          });
        },
      });
    } catch (error: any) {
      if (error.name !== "AbortError") {
        setIsUploading(false);
        setIsAnalyzing(false);
        setCanCancel(false);
        toast({
          title: "Upload failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl font-bold">
              Upload Your{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Bank Statement
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload your PDF bank statement to get instant AI-powered financial
              insights
            </p>
          </div>

          {/* Upload Area */}
          {!isUploading && (
            <GlassCard className="p-8 animate-slide-up">
              <div
                className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-primary bg-primary/5 scale-105"
                    : file
                    ? "border-success bg-success/5"
                    : "border-border hover:border-primary/50 hover:bg-primary/5"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />

                <div className="space-y-6">
                  {file ? (
                    <>
                      <CheckCircle className="w-16 h-16 text-success mx-auto" />
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-success">
                          File Ready!
                        </h3>
                        <p className="text-muted-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={uploadIcon}
                        alt="Upload"
                        className="w-16 h-16 mx-auto opacity-50"
                      />
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">
                          Drag and drop your PDF here
                        </h3>
                        <p className="text-muted-foreground">
                          or click to browse your files
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>PDF only</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>Max 10MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Currency Selection and Analysis Options */}
          {(file || isUploading) && (
            <GlassCard className="p-6 animate-fade-in">
              <div className="space-y-4">
                {/* Currency Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Currency (Optional)
                  </label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isUploading}
                  >
                    <option value="">Auto-detect currency</option>
                    {Object.entries(currencies).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.symbol} {info.name} ({code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Messages */}
                {(isUploading || statusMessages.length > 0) && (
                  <div className="p-3 bg-muted rounded-md">
                    <h4 className="text-sm font-medium mb-2">PDF Status:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {statusMessages.map((message, index) => (
                        <p
                          key={index}
                          className="text-xs text-muted-foreground"
                        >
                          {message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analysis Chunks Preview */}
                {analysisChunks.length > 0 && (
                  <div className="p-3 bg-muted rounded-md">
                    <h4 className="text-sm font-medium mb-2">
                      Analysis with AI:
                    </h4>

                    <div
                      className="text-xs text-muted-foreground max-h-24 overflow-y-auto whitespace-pre-line"
                      ref={(el) => {
                        if (el) el.scrollTop = el.scrollHeight;
                      }}
                    >
                      {analysisChunks.join("\n\n")}
                      {isAnalyzing && (
                        <div className="flex items-center space-x-2 mt-3">
                          <Loader className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-xs text-primary">
                            Analyzing...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Action Buttons */}
          {file && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex space-x-2">
                <Button
                  size="lg"
                  className="flex-1 bg-gradient-primary hover:shadow-glow text-lg py-6"
                  onClick={handleAnalysis}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      {isAnalyzing ? "Analyzing..." : "Uploading..."}
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-5 h-5 mr-2" />
                      Analyze Statement
                    </>
                  )}
                </Button>

                {canCancel && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-6"
                    onClick={handleCancel}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                size="lg"
                className="w-full text-lg py-6"
                onClick={() => setFile(null)}
                disabled={isUploading}
              >
                Choose Different File
              </Button>
            </div>
          )}

          {/* Security Notice */}
          <GlassCard className="p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold">Your data is secure</h4>
                <p className="text-sm text-muted-foreground">
                  We process your bank statement locally and don't store any
                  personal financial information. Your privacy and security are
                  our top priorities.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
