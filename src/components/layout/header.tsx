"use client";

import { ThemeToggle } from "./theme-toggle";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileNav } from "./mobile-nav";
import { Battery } from "lucide-react";

interface HeaderProps {
  userEmail?: string;
}

export function Header({ userEmail }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border glass">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Mobile Logo + Nav */}
        <div className="flex items-center gap-3 lg:hidden">
          <MobileNav />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg gradient-primary">
              <Battery className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm">Battery Inv.</span>
          </div>
        </div>

        {/* Desktop spacer */}
        <div className="hidden lg:block" />

        {/* Right section */}
        <div className="flex items-center gap-2">
          {userEmail && (
            <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[200px]">
              {userEmail}
            </span>
          )}
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
