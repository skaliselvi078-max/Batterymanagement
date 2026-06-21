"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your application preferences
        </p>
      </div>

      {/* Theme Settings */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Appearance</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose your preferred theme
        </p>

        {mounted && (
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {themes.map((t) => (
              <Button
                key={t.value}
                variant="outline"
                className={cn(
                  "h-20 rounded-xl border-2 flex flex-col gap-2 transition-all",
                  theme === t.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "hover:border-primary/50"
                )}
                onClick={() => setTheme(t.value)}
              >
                <t.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{t.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">About</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Application</span>
            <span className="font-medium">Battery Inventory Management</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Framework</span>
            <span className="font-medium">Next.js 15</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Database</span>
            <span className="font-medium">Supabase PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
