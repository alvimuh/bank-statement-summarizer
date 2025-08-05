import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  blur?: boolean;
}

export const GlassCard = ({ children, className, blur = true }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "bg-card/80 border border-border/50 rounded-lg shadow-card",
        blur && "backdrop-blur-glass",
        "transition-all duration-300 hover:shadow-glow hover:border-primary/30",
        className
      )}
    >
      {children}
    </div>
  );
};