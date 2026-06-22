export interface ValidationErrors {
  [key: string]: string;
}

export function validateCustomerForm(data: {
  customer_name?: string;
  phone_number?: string;
  battery_serial_number?: string;
  battery_amount?: string;
  paid_amount?: string;
  purchase_date?: string;
  payment_status?: string;
  vehicle_number?: string;
  ups_name?: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  // Customer Name (optional, but validate length if provided)
  if (data.customer_name && data.customer_name.trim() && data.customer_name.trim().length < 2) {
    errors.customer_name = "Name must be at least 2 characters";
  }

  // Phone Number (optional, but validate format if provided)
  if (data.phone_number && data.phone_number.trim()) {
    if (!/^[+]?[\d\s\-()]{7,15}$/.test(data.phone_number.trim())) {
      errors.phone_number = "Please enter a valid phone number";
    }
  }

  // Battery Amount (optional, but validate format if provided)
  let totalAmountVal = 0;
  if (data.battery_amount && data.battery_amount.trim()) {
    totalAmountVal = Number(data.battery_amount);
    if (isNaN(totalAmountVal) || totalAmountVal < 0) {
      errors.battery_amount = "Please enter a valid amount (greater than or equal to 0)";
    }
  }

  // Paid Amount (optional, but validate format if provided)
  if (data.payment_status === "pending" && data.paid_amount && data.paid_amount.trim()) {
    const paid = Number(data.paid_amount);
    if (isNaN(paid) || paid < 0) {
      errors.paid_amount = "Please enter a valid amount (greater than or equal to 0)";
    } else if (data.battery_amount && data.battery_amount.trim() && !errors.battery_amount && paid >= totalAmountVal) {
      errors.paid_amount = "Paid amount must be less than total amount (otherwise mark as Completed)";
    }
  }

  // Payment Status (optional)
  if (data.payment_status && !["pending", "paid", "completed"].includes(data.payment_status)) {
    errors.payment_status = "Please select a valid payment status";
  }

  return errors;
}
