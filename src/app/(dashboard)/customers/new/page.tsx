import { CustomerForm } from "@/components/customers/customer-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Customer | Battery Inventory Management",
  description: "Add a new customer to the battery inventory",
};

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Add Customer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the customer and battery details
        </p>
      </div>
      <CustomerForm mode="create" />
    </div>
  );
}
