// =============================================
// TypeScript Types & Interfaces
// =============================================

export interface Customer {
  id: string;
  customer_name: string;
  phone_number: string;
  email: string | null;
  battery_serial_number: string;
  battery_amount: number;
  purchase_date: string;
  payment_status: "pending" | "paid" | "completed";
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export type CustomerInsert = Omit<
  Customer,
  "id" | "is_deleted" | "created_at" | "updated_at"
>;

export type CustomerUpdate = Partial<
  Omit<Customer, "id" | "created_at" | "updated_at">
>;

export type PaymentStatus = "pending" | "paid" | "completed";

export interface DashboardStats {
  totalCustomers: number;
  totalPending: number;
  pendingAmount: number;
  totalCompleted: number;
  completedAmount: number;
  totalPaid: number;
  paidAmount: number;
  totalRevenue: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SearchParams {
  query: string;
  field: "customer_name" | "phone_number" | "battery_serial_number" | "all";
}

export interface SortParams {
  column: keyof Customer;
  direction: "asc" | "desc";
}

export interface BackupFile {
  name: string;
  created_at: string;
  size: number;
}
