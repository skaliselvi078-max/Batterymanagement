import { Customer } from "./types";
import * as XLSX from "xlsx";

export function exportToCSV(data: Customer[], filename: string): void {
  if (data.length === 0) return;

  const headers = [
    "Customer Name",
    "Phone Number",
    "Email",
    "Battery Serial Number",
    "Battery Amount",
    "Paid Amount",
    "Remaining Balance",
    "Purchase Date",
    "Payment Status",
    "Created At",
  ];

  const rows = data.map((customer) => {
    const paidAmount = customer.payment_status === "completed"
      ? customer.battery_amount
      : (customer.paid_amount || 0);
    const remainingBalance = customer.battery_amount - paidAmount;

    return [
      customer.customer_name,
      customer.phone_number,
      customer.email || "",
      customer.battery_serial_number,
      customer.battery_amount.toString(),
      paidAmount.toString(),
      remainingBalance.toString(),
      customer.purchase_date,
      customer.payment_status,
      customer.created_at,
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToExcel(data: Customer[], filename: string): void {
  if (data.length === 0) return;

  const worksheetData = data.map((customer) => {
    const paidAmount = customer.payment_status === "completed"
      ? customer.battery_amount
      : (customer.paid_amount || 0);
    const remainingBalance = customer.battery_amount - paidAmount;

    return {
      "Customer Name": customer.customer_name,
      "Phone Number": customer.phone_number,
      Email: customer.email || "",
      "Battery Serial Number": customer.battery_serial_number,
      "Battery Amount": customer.battery_amount,
      "Paid Amount": paidAmount,
      "Remaining Balance": remainingBalance,
      "Purchase Date": customer.purchase_date,
      "Payment Status": customer.payment_status,
      "Created At": customer.created_at,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

  // Auto-size columns
  const colWidths = Object.keys(worksheetData[0]).map((key) => ({
    wch: Math.max(
      key.length,
      ...worksheetData.map((row) => String(row[key as keyof typeof row]).length)
    ),
  }));
  worksheet["!cols"] = colWidths;

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, `${filename}.xlsx`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function generateCSVString(data: Customer[]): string {
  const headers = [
    "id",
    "customer_name",
    "phone_number",
    "email",
    "battery_serial_number",
    "battery_amount",
    "paid_amount",
    "purchase_date",
    "payment_status",
    "is_deleted",
    "created_at",
    "updated_at",
  ];

  const rows = data.map((customer) => [
    customer.id,
    customer.customer_name,
    customer.phone_number,
    customer.email || "",
    customer.battery_serial_number,
    customer.battery_amount.toString(),
    (customer.paid_amount || 0).toString(),
    customer.purchase_date,
    customer.payment_status,
    customer.is_deleted.toString(),
    customer.created_at,
    customer.updated_at,
  ]);

  return [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
}
