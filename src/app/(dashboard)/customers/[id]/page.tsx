"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Customer } from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/customers/status-badge";
import { DeleteDialog } from "@/components/customers/delete-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Battery,
  Calendar,
  IndianRupee,
  Tag,
  Car,
  Server,
} from "lucide-react";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        router.push("/customers");
        return;
      }
      setCustomer(data);
      setLoading(false);
    };

    fetchCustomer();
  }, [params.id, supabase, router]);

  const handleDelete = async () => {
    if (!customer) return;
    try {
      const { error } = await supabase
        .from("customers")
        .update({ is_deleted: true })
        .eq("id", customer.id);

      if (error) {
        toast.error(`Failed to delete customer: ${error.message}`);
        console.error("Delete customer error:", error);
        return;
      }

      toast.success("Customer deleted successfully!");
      router.push("/customers");
      router.refresh();
    } catch (err: any) {
      toast.error(`An unexpected error occurred: ${err.message || err}`);
      console.error("Unexpected delete error:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="glass-card rounded-2xl p-8 space-y-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const detailItems = [
    {
      icon: User,
      label: "Customer Name",
      value: customer.customer_name || "—",
      gradient: "gradient-primary",
    },
    {
      icon: Phone,
      label: "Phone Number",
      value: customer.phone_number || "—",
      gradient: "gradient-info",
    },
    ...(customer.vehicle_number
      ? [
          {
            icon: Car,
            label: "Vehicle Number",
            value: customer.vehicle_number,
            gradient: "gradient-success",
          },
        ]
      : []),
    ...(customer.ups_name
      ? [
          {
            icon: Server,
            label: "UPS Name",
            value: customer.ups_name,
            gradient: "gradient-success",
          },
        ]
      : []),
    {
      icon: Battery,
      label: "Battery Serial Number",
      value: customer.battery_serial_number || "—",
      gradient: "gradient-warning",
      mono: true,
    },
    {
      icon: IndianRupee,
      label: "Battery Cost",
      value: customer.battery_amount !== null ? formatCurrency(customer.battery_amount) : "—",
      gradient: "gradient-success",
    },
    ...(customer.payment_status === "pending"
      ? [
          {
            icon: IndianRupee,
            label: "Paid Amount",
            value: formatCurrency(customer.paid_amount || 0),
            gradient: "gradient-info",
          },
          {
            icon: IndianRupee,
            label: "Remaining Balance",
            value: formatCurrency((customer.battery_amount || 0) - (customer.paid_amount || 0)),
            gradient: "gradient-danger",
          },
        ]
      : []),
    {
      icon: Calendar,
      label: "Purchase Date",
      value: formatDate(customer.purchase_date),
      gradient: "gradient-primary",
    },
    {
      icon: Tag,
      label: "Payment Status",
      value: customer.payment_status,
      gradient: "gradient-danger",
      isBadge: true,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {customer.customer_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Added {formatDateTime(customer.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/customers/${customer.id}/edit`}>
            <Button
              variant="outline"
              className="rounded-xl border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            className="rounded-xl border-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Details Card */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {detailItems.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-4 p-3 rounded-xl hover:bg-accent/50 transition-colors"
            >
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-xl text-white shrink-0 ${item.gradient}`}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </p>
                {item.isBadge ? (
                  <StatusBadge status={item.value} className="mt-1" />
                ) : (
                  <p
                    className={`text-sm font-semibold text-foreground mt-0.5 truncate ${
                      item.mono ? "font-mono" : ""
                    }`}
                  >
                    {item.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        customerName={customer.customer_name || "Unnamed Customer"}
      />
    </div>
  );
}
