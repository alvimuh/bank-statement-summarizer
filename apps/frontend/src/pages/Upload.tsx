import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Navigation } from "@/components/navigation";
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import uploadIcon from "@/assets/upload-icon.png";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFile = useCallback((selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
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
  }, [toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleAnalysis = async () => {
    if (!file) return;

    setIsUploading(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navigate to analysis page with mock data
    navigate("/analysis", { 
      state: { 
        fileName: file.name,
        mockData: true 
      } 
    });
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
              Upload your PDF bank statement to get instant AI-powered financial insights
            </p>
          </div>

          {/* Upload Area */}
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
                      <h3 className="text-xl font-semibold text-success">File Ready!</h3>
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

          {/* Action Buttons */}
          {file && (
            <div className="space-y-4 animate-fade-in">
              <Button
                size="lg"
                className="w-full bg-gradient-primary hover:shadow-glow text-lg py-6"
                onClick={handleAnalysis}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-5 h-5 mr-2" />
                    Analyze Statement
                  </>
                )}
              </Button>

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
                  We process your bank statement locally and don't store any personal financial information. 
                  Your privacy and security are our top priorities.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}