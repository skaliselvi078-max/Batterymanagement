"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database,
  Download,
  FileText,
  RefreshCw,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

interface BackupFile {
  name: string;
  created_at: string;
  metadata: {
    size: number;
  };
}

export default function BackupsPage() {
  const supabase = createClient();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("backups")
        .list("", {
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) throw error;
      setBackups((data as BackupFile[]) || []);
    } catch (error: any) {
      console.error("Error fetching backups:", error);
      toast.error("Could not load backups. Make sure the 'backups' storage bucket exists.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleDownload = async (fileName: string) => {
    setDownloading(fileName);
    try {
      const { data, error } = await supabase.storage
        .from("backups")
        .download(fileName);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${fileName}`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download backup");
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Backups
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automatic daily backups stored in Supabase Storage
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl border-2"
          onClick={fetchBackups}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Backups List */}
      {loading ? (
        <div className="glass-card rounded-2xl p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      ) : backups.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No backups found</p>
          <p className="text-xs text-muted-foreground">
            Backups are created automatically every day at 1:00 AM UTC via Vercel Cron
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border">
          {backups.map((backup, index) => (
            <div
              key={backup.name}
              className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {backup.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDateTime(backup.created_at)}
                    </span>
                    {backup.metadata?.size && (
                      <span>{formatFileSize(backup.metadata.size)}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => handleDownload(backup.name)}
                disabled={downloading === backup.name}
              >
                {downloading === backup.name ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                <span className="hidden sm:inline">Download</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
