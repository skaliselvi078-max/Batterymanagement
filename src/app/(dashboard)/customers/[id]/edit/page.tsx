"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { Customer } from "@/lib/types";
import { CustomerForm } from "@/components/customers/customer-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const { data: customer, isLoading: loading } = useSWR(
    params.id ? `customer-${params.id}` : null,
    async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        router.push("/customers");
        return null;
      }
      return data as Customer;
    },
    { revalidateOnFocus: false }
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="glass-card rounded-2xl p-8 space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-6">
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
            Edit Customer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update details for {customer.customer_name}
          </p>
        </div>
      </div>
      <CustomerForm customer={customer} mode="edit" />
    </div>
  );
}
