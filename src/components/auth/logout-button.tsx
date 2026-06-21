"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
      return;
    }
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
      onClick={handleLogout}
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
