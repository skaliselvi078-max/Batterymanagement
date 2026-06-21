import { Battery } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4 animate-pulse-soft">
        <div className="flex items-center justify-center h-16 w-16 rounded-2xl gradient-primary shadow-lg shadow-primary/30">
          <Battery className="h-8 w-8 text-white" />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
