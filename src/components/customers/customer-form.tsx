"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Customer } from "@/lib/types";
import { validateCustomerForm, ValidationErrors } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, QrCode } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const QRScanner = dynamic(
  () => import("./qr-scanner").then((mod) => mod.QRScannerDialog),
  { ssr: false }
);

interface CustomerFormProps {
  customer?: Customer;
  mode: "create" | "edit";
}

export function CustomerForm({ customer, mode }: CustomerFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const formRef = useRef<HTMLFormElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [scannerOpen, setScannerOpen] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: customer?.customer_name || "",
    phone_number: customer?.phone_number || "",
    email: customer?.email || "",
    battery_serial_number: customer?.battery_serial_number || "",
    battery_amount: customer?.battery_amount?.toString() || "",
    paid_amount: customer?.paid_amount?.toString() || "",
    purchase_date: customer?.purchase_date || new Date().toISOString().split("T")[0],
    payment_status: customer?.payment_status || "pending",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ensure the focused field is visible (not hidden by keyboard on mobile)
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const handleScanResult = (result: string) => {
    handleChange("battery_serial_number", result);
    setScannerOpen(false);
    toast.success("Serial number scanned successfully!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateCustomerForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const el = document.getElementById(firstErrorField);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsLoading(true);

    const batteryAmount = parseFloat(formData.battery_amount);
    const paidAmount = formData.payment_status === "completed"
      ? batteryAmount
      : parseFloat(formData.paid_amount || "0");

    const payload = {
      customer_name: formData.customer_name.trim(),
      phone_number: formData.phone_number.trim(),
      email: formData.email.trim() || null,
      battery_serial_number: formData.battery_serial_number.trim(),
      battery_amount: batteryAmount,
      paid_amount: paidAmount,
      purchase_date: formData.purchase_date,
      payment_status: formData.payment_status,
    };

    try {
      if (mode === "create") {
        const { error } = await supabase.from("customers").insert([payload]);
        if (error) throw error;
        toast.success("Customer added successfully!");
        router.push("/customers");
      } else if (customer) {
        const { error } = await supabase
          .from("customers")
          .update(payload)
          .eq("id", customer.id);
        if (error) throw error;
        toast.success("Customer updated successfully!");
        router.push(`/customers/${customer.id}`);
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-6 md:p-8 space-y-6 animate-scale-in"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Name */}
          <div className="space-y-2">
            <div className="floating-label-group">
              <Input
                id="customer_name"
                placeholder=" "
                value={formData.customer_name}
                onChange={(e) => handleChange("customer_name", e.target.value)}
                onFocus={handleFocus}
                className={`h-14 rounded-xl bg-background border-2 text-base transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  errors.customer_name ? "border-destructive" : "border-input"
                }`}
                disabled={isLoading}
              />
              <label htmlFor="customer_name" className="floating-label">
                Customer Name *
              </label>
            </div>
            {errors.customer_name && (
              <p className="text-xs text-destructive animate-slide-down">
                {errors.customer_name}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <div className="floating-label-group">
              <Input
                id="phone_number"
                type="tel"
                placeholder=" "
                value={formData.phone_number}
                onChange={(e) => handleChange("phone_number", e.target.value)}
                onFocus={handleFocus}
                className={`h-14 rounded-xl bg-background border-2 text-base transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  errors.phone_number ? "border-destructive" : "border-input"
                }`}
                disabled={isLoading}
              />
              <label htmlFor="phone_number" className="floating-label">
                Phone Number *
              </label>
            </div>
            {errors.phone_number && (
              <p className="text-xs text-destructive animate-slide-down">
                {errors.phone_number}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <div className="floating-label-group">
              <Input
                id="email"
                type="email"
                placeholder=" "
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onFocus={handleFocus}
                className={`h-14 rounded-xl bg-background border-2 text-base transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  errors.email ? "border-destructive" : "border-input"
                }`}
                disabled={isLoading}
              />
              <label htmlFor="email" className="floating-label">
                Email Address
              </label>
            </div>
            {errors.email && (
              <p className="text-xs text-destructive animate-slide-down">
                {errors.email}
              </p>
            )}
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <Label htmlFor="purchase_date" className="text-sm font-medium">
              Purchase Date *
            </Label>
            <Input
              id="purchase_date"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => handleChange("purchase_date", e.target.value)}
              onFocus={handleFocus}
              className={`h-14 rounded-xl bg-background border-2 text-base transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                errors.purchase_date ? "border-destructive" : "border-input"
              }`}
              disabled={isLoading}
            />
            {errors.purchase_date && (
              <p className="text-xs text-destructive animate-slide-down">
                {errors.purchase_date}
              </p>
            )}
          </div>

          {/* Battery Amount */}
          <div className="space-y-2">
            <div className="floating-label-group">
              <Input
                id="battery_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder=" "
                value={formData.battery_amount}
                onChange={(e) => handleChange("battery_amount", e.target.value)}
                onFocus={handleFocus}
                className={`h-14 rounded-xl bg-background border-2 text-base transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  errors.battery_amount ? "border-destructive" : "border-input"
                }`}
                disabled={isLoading}
              />
              <label htmlFor="battery_amount" className="floating-label">
                Battery Amount (₹) *
              </label>
            </div>
            {errors.battery_amount && (
              <p className="text-xs text-destructive animate-slide-down">
                {errors.battery_amount}
              </p>
            )}
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label htmlFor="payment_status" className="text-sm font-medium">
              Payment Status *
            </Label>
            <Select
              value={formData.payment_status}
              onValueChange={(value) => {
                handleChange("payment_status", value ?? "pending");
                if (value === "completed") {
                  handleChange("paid_amount", "");
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger
                id="payment_status"
                className={`h-14 rounded-xl bg-background border-2 text-base transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  errors.payment_status ? "border-destructive" : "border-input"
                }`}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Pending
                  </span>
                </SelectItem>
                <SelectItem value="completed">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Completed
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.payment_status && (
              <p className="text-xs text-destructive animate-slide-down">
                {errors.payment_status}
              </p>
            )}
          </div>

          {/* Paid Amount (Conditional) */}
          {formData.payment_status === "pending" && (
            <div className="space-y-2 animate-slide-down">
              <div className="floating-label-group">
                <Input
                  id="paid_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder=" "
                  value={formData.paid_amount}
                  onChange={(e) => handleChange("paid_amount", e.target.value)}
                  onFocus={handleFocus}
                  className={`h-14 rounded-xl bg-background border-2 text-base transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    errors.paid_amount ? "border-destructive" : "border-input"
                  }`}
                  disabled={isLoading}
                />
                <label htmlFor="paid_amount" className="floating-label">
                  Paid Amount (₹) *
                </label>
              </div>
              {errors.paid_amount && (
                <p className="text-xs text-destructive animate-slide-down">
                  {errors.paid_amount}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Battery Serial Number (full width) */}
        <div className="space-y-2">
          <Label htmlFor="battery_serial_number" className="text-sm font-medium">
            Battery Serial Number *
          </Label>
          <div className="flex gap-3">
            <div className="flex-1 floating-label-group">
              <Input
                id="battery_serial_number"
                placeholder=" "
                value={formData.battery_serial_number}
                onChange={(e) =>
                  handleChange("battery_serial_number", e.target.value)
                }
                onFocus={handleFocus}
                className={`h-14 rounded-xl bg-background border-2 text-base font-mono transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                  errors.battery_serial_number
                    ? "border-destructive"
                    : "border-input"
                }`}
                disabled={isLoading}
              />
              <label htmlFor="battery_serial_number" className="floating-label">
                Type or scan serial number
              </label>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-14 w-14 rounded-xl border-2 shrink-0 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              onClick={() => setScannerOpen(true)}
              disabled={isLoading}
            >
              <QrCode className="h-6 w-6" />
            </Button>
          </div>
          {errors.battery_serial_number && (
            <p className="text-xs text-destructive animate-slide-down">
              {errors.battery_serial_number}
            </p>
          )}
        </div>

        {/* Submit & Cancel */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end pt-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full sm:w-auto px-8 rounded-xl text-base font-semibold border-2"
            onClick={() => router.push(mode === "create" ? "/customers" : `/customers/${customer?.id}`)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-12 w-full sm:w-auto px-8 rounded-xl text-base font-semibold gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2 w-full">
                <Loader2 className="h-5 w-5 animate-spin" />
                {mode === "create" ? "Adding..." : "Saving..."}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 w-full">
                <Save className="h-5 w-5" />
                {mode === "create" ? "Add Customer" : "Save Changes"}
              </span>
            )}
          </Button>
        </div>
      </form>

      {/* QR Scanner Dialog */}
      <QRScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScanResult}
      />
    </>
  );
}
