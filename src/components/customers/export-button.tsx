"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { exportToCSV, exportToExcel } from "@/lib/export";
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
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ExportButton() {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportMode, setExportMode] = useState<"all" | "range">("all");
  const [format, setFormat] = useState<"excel" | "csv">("excel");

  // Set defaults: start of current month and today's date
  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayOfMonthStr = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  })();

  const [startDate, setStartDate] = useState(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);

  const handleExport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("customers")
        .select("*")
        .eq("is_deleted", false);

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
        query = query
          .gte("purchase_date", startDate)
          .lte("purchase_date", endDate);
      }

      // Order by purchase_date DESC for consistency
      query = query.order("purchase_date", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const customersData = data || [];
      if (customersData.length === 0) {
        toast.info("No data found for the selected range");
        return;
      }

      const fileDate = exportMode === "range" ? `${startDate}_to_${endDate}` : todayStr;

      if (format === "csv") {
        exportToCSV(customersData, `battery-inventory-${fileDate}`);
        toast.success("CSV exported successfully!");
      } else {
        exportToExcel(customersData, `battery-inventory-${fileDate}`);
        toast.success("Excel file exported successfully!");
      }
      setOpen(false); // Close dialog on success
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export data");
    } finally {
      setLoading(false);
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
      <DialogContent className="rounded-2xl max-w-md w-[95%]">
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

          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Select Format</Label>
            <div className="grid grid-cols-2 gap-2 bg-muted/50 p-1 rounded-xl border">
              <button
                type="button"
                onClick={() => setFormat("excel")}
                className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                  format === "excel"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                  format === "csv"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4 text-blue-500" />
                CSV (.csv)
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="rounded-xl h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading}
            className="rounded-xl h-11 gradient-primary hover:opacity-90 transition-all font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
