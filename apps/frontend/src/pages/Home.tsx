import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Navigation } from "@/components/navigation";
import { ArrowRight, Shield, Zap, Brain, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroGraphic from "@/assets/hero-graphic.png";

export default function Home() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced AI processes your bank statements to extract meaningful insights and categorize transactions intelligently."
    },
    {
      icon: TrendingUp,
      title: "Visual Insights",
      description: "Beautiful charts and graphs help you understand your spending patterns and income trends at a glance."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Upload your PDF and get comprehensive analysis in seconds. No more manual categorization needed."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your financial data is processed securely. We don't store your personal information or banking details."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Transform Your{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Bank Statements
                </span>{" "}
                into Insights
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Upload your PDF bank statement and get instant AI-powered analysis with beautiful visualizations. 
                Understand your spending patterns, track income, and make better financial decisions.
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
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                View Demo
              </Button>
            </div>
          </div>

          <div className="relative animate-float">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full"></div>
            <img
              src={heroGraphic}
              alt="Financial Dashboard"
              className="relative z-10 w-full max-w-lg mx-auto drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Why Choose{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              StatementAI
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to give you complete control over your financial data
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <GlassCard
              key={index}
              className="p-6 hover:scale-105 transition-transform duration-300"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
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
      <section className="container mx-auto px-6 py-20">
        <GlassCard className="p-12 text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your bank statement PDF and discover insights you never knew existed in your financial data.
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