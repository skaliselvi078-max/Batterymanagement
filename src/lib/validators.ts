export interface ValidationErrors {
  [key: string]: string;
}

export function validateCustomerForm(data: {
  customer_name: string;
  phone_number: string;
  email: string;
  battery_serial_number: string;
  battery_amount: string;
  purchase_date: string;
  payment_status: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  // Customer Name
  if (!data.customer_name.trim()) {
    errors.customer_name = "Customer name is required";
  } else if (data.customer_name.trim().length < 2) {
    errors.customer_name = "Name must be at least 2 characters";
  }

  // Phone Number
  if (!data.phone_number.trim()) {
    errors.phone_number = "Phone number is required";
  } else if (!/^[+]?[\d\s\-()]{7,15}$/.test(data.phone_number.trim())) {
    errors.phone_number = "Please enter a valid phone number";
  }

  // Email (optional but validate format if provided)
  if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  // Battery Serial Number
  if (!data.battery_serial_number.trim()) {
    errors.battery_serial_number = "Battery serial number is required";
  }

  // Battery Amount
  if (!data.battery_amount.trim()) {
    errors.battery_amount = "Battery amount is required";
  } else if (isNaN(Number(data.battery_amount)) || Number(data.battery_amount) <= 0) {
    errors.battery_amount = "Please enter a valid amount greater than 0";
  }

  // Purchase Date
  if (!data.purchase_date) {
    errors.purchase_date = "Purchase date is required";
  }

  // Payment Status
  if (!["pending", "paid", "completed"].includes(data.payment_status)) {
    errors.payment_status = "Please select a valid payment status";
  }

  return errors;
}
