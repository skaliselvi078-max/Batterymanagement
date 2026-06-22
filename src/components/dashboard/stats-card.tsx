"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  isCurrency?: boolean;
  gradient: string;
  delay?: number;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  isCurrency = false,
  gradient,
  delay = 0,
}: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 800; // Reduced from 1200ms to 800ms
    const steps = 15; // Reduced from 40 to 15 (fewer re-renders)
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplayValue(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isVisible]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl cursor-default",
        "glass-card",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Gradient accent */}
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20",
          gradient
        )}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {isCurrency ? formatCurrency(displayValue) : displayValue.toLocaleString("en-IN")}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center justify-center h-11 w-11 rounded-xl text-white shrink-0",
            gradient
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
