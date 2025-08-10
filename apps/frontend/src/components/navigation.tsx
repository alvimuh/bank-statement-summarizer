import { Button } from "@/components/ui/button";
import { BarChart3, Upload, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-150 ${
        scrolled
          ? "backdrop-blur-glass border-b border-border/50"
          : "backdrop-blur-0 border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            StatementAI
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant={location.pathname === "/" ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/")}
            className="text-sm"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button
            variant={location.pathname === "/upload" ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate("/upload")}
            className="text-sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>
    </nav>
  );
};
