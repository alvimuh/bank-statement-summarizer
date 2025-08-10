import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Navigation } from "@/components/navigation";
import {
  ArrowRight,
  Shield,
  Zap,
  Brain,
  TrendingUp,
  Loader,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import heroGraphic from "@/assets/illustration-2.webp";
import AiIcon from "@/assets/illustration-1.webp";
import PdfIcon from "@/assets/illustration-3.webp";
import ChartIcon from "@/assets/illustration-4.webp";

export default function Home() {
  // No mouse movement tracking needed for static spotlight

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleDemo = () => {
    setIsLoading(true);
    // Navigate to Upload page with a query parameter to indicate demo mode
    navigate("/upload?demo=true");
  };

  const benefits = [
    {
      icon: AiIcon,
      title: "AI-Powered Analysis",
      description:
        "Advanced AI processes your bank statements to extract meaningful insights and categorize transactions intelligently.",
    },
    {
      icon: ChartIcon,
      title: "Visual Insights",
      description:
        "Beautiful charts and graphs help you understand your spending patterns and income trends at a glance.",
    },
    {
      icon: PdfIcon,
      title: "Secure & Private",
      description:
        "Your financial data is processed securely. We don't store your personal information or banking details.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="h-screen absolute w-full">
        <div className="absolute inset-0 bg-gradient-primary size-[500px] md:size-[800px] -top-[20%] md:-top-[40%] blur-3xl md:blur-[200px] left-1/2 -translate-x-1/2 opacity-20 rounded-full"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        <div className="w-full h-60 bg-gradient-to-t from-background absolute bottom-0" />
      </div>

      {/* Hero Section */}
      <section className="container max-w-6xl mx-auto px-6">
        {/* Background Grid with animation */}

        {/* <div className="h-72 bg-background absolute bottom-0 left-0" /> */}
        <div className="grid lg:grid-cols-2 gap-12 items-center relative">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Ubah Bank Statement jadi{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Insights
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Unggah file PDF dari m-banking Anda, dan dapatkan analisis
                instan berbasis AI dengan visualisasi yang menarik.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-primary hover:shadow-glow text-lg px-8 py-6 animate-pulse-glow"
                onClick={() => navigate("/upload")}
              >
                Start Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6"
                onClick={handleDemo}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Loading Demo...
                  </>
                ) : (
                  "View Demo"
                )}
              </Button>
            </div>
          </div>

          <div className="relative animate-float">
            <img
              src={heroGraphic}
              alt="Financial Dashboard"
              className="relative z-10 w-full max-w-lg mx-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container max-w-6xl mx-auto px-6 py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Kenapa harus{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              StatementAI ?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pahami pola pengeluaran, pantau pendapatan, dan buat keputusan
            keuangan yang lebih baik.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <GlassCard
              key={index}
              className="p-6 hover:scale-105 transition-transform duration-300"
            >
              <div className="space-y-4">
                <img
                  src={benefit.icon}
                  alt={benefit.title}
                  className="size-40"
                />
                <h3 className="text-xl font-semibold">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container max-w-6xl mx-auto px-6 py-20">
        <GlassCard className="p-12 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unggah file PDF bank statement Anda dan temukan insight yang belum
            pernah Anda ketahui dalam data keuangan Anda!
          </p>
          <Button
            size="lg"
            className="bg-gradient-primary hover:shadow-glow text-lg px-12 py-6 animate-pulse-glow"
            onClick={() => navigate("/upload")}
          >
            Upload Your Statement
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </GlassCard>
      </section>
    </div>
  );
}
