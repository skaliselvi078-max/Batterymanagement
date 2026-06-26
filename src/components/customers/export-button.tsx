"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { exportToExcel } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Loader2, Cloud } from "lucide-react";
import { toast } from "sonner";

export function ExportButton() {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [exportMode, setExportMode] = useState<"all" | "range">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const format = "excel";

  // Set defaults: start of current month and today's date
  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayOfMonthStr = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  })();

  const [startDate, setStartDate] = useState(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);

  const handleDownload = async () => {
    setLoading(true);
    try {
      if (exportMode === "range") {
        if (!startDate || !endDate) {
          toast.error("Please select both start and end dates");
          setLoading(false);
          return;
        }
        if (startDate > endDate) {
          toast.error("Start date cannot be after end date");
          setLoading(false);
          return;
        }
      }

      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from("customers")
          .select("*")
          .eq("is_deleted", false);

        if (exportMode === "range") {
          query = query
            .gte("purchase_date", startDate)
            .lte("purchase_date", endDate);
        }

        if (statusFilter !== "all") {
          query = query.eq("payment_status", statusFilter);
        }

        query = query
          .order("purchase_date", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      const customersData = allData;
      if (customersData.length === 0) {
        toast.info("No data found for the selected filters");
        return;
      }

      const statusSuffix = statusFilter !== "all" ? `-${statusFilter}` : "";
      const fileDate = exportMode === "range" ? `${startDate}_to_${endDate}` : todayStr;
      const fileName = `battery-inventory${statusSuffix}-${fileDate}`;

      exportToExcel(customersData, fileName);
      toast.success("Excel file exported successfully!");
      setOpen(false); // Close dialog on success
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export data");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadToDrive = async () => {
    setDriveLoading(true);
    try {
      if (exportMode === "range") {
        if (!startDate || !endDate) {
          toast.error("Please select both start and end dates");
          setDriveLoading(false);
          return;
        }
        if (startDate > endDate) {
          toast.error("Start date cannot be after end date");
          setDriveLoading(false);
          return;
        }
      }

      const response = await fetch("/api/export/drive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exportMode,
          startDate: exportMode === "range" ? startDate : null,
          endDate: exportMode === "range" ? endDate : null,
          statusFilter,
          format,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload to Google Drive");
      }

      toast.success(`Successfully uploaded "${result.fileName}" to Google Drive!`);
      setOpen(false);
    } catch (error: any) {
      console.error("Google Drive upload error:", error);
      toast.error(error.message || "Failed to upload to Google Drive");
    } finally {
      setDriveLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button
          variant="outline"
          className="rounded-xl border-2 border-input bg-background px-4 h-11 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all"
        />
      }>
        <Download className="h-4 w-4 mr-2" />
        Export
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-xl w-[95%]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Export Customers Data</DialogTitle>
          <DialogDescription>
            Select range and format to download customer invoices and battery history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Mode Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Select Range</Label>
            <div className="grid grid-cols-2 gap-2 bg-muted/50 p-1 rounded-xl border">
              <button
                type="button"
                onClick={() => setExportMode("all")}
                className={`py-2 text-sm font-medium rounded-lg transition-all ${
                  exportMode === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Data
              </button>
              <button
                type="button"
                onClick={() => setExportMode("range")}
                className={`py-2 text-sm font-medium rounded-lg transition-all ${
                  exportMode === "range"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Date Range
              </button>
            </div>
          </div>

          {/* Date Picker Fields (Conditional) */}
          {exportMode === "range" && (
            <div className="grid grid-cols-2 gap-3 animate-slide-down">
              <div className="space-y-1.5">
                <Label htmlFor="start_date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl h-11 border-2 bg-background font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl h-11 border-2 bg-background font-medium"
                />
              </div>
            </div>
          )}

          {/* Status Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Filter by Payment Status</Label>
            <div className="grid grid-cols-3 gap-2 bg-muted/50 p-1 rounded-xl border">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  statusFilter === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  statusFilter === "pending"
                    ? "bg-background text-destructive hover:text-destructive shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={`py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  statusFilter === "completed"
                    ? "bg-background text-primary hover:text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Completed
              </button>
            </div>
          </div>

        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4 sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading || driveLoading}
            className="rounded-xl h-11 sm:w-auto w-full"
          >
            Cancel
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={handleDownload}
              disabled={loading || driveLoading}
              variant="secondary"
              className="rounded-xl h-11 font-semibold w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download to Device
                </>
              )}
            </Button>
            <Button
              onClick={handleUploadToDrive}
              disabled={loading || driveLoading}
              className="rounded-xl h-11 gradient-primary hover:opacity-90 transition-all font-semibold w-full sm:w-auto"
            >
              {driveLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4 mr-2" />
                  Save to Google Drive
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
