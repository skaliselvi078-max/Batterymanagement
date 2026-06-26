import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";
import { Readable } from "stream";

// Helper function to build Excel buffer in memory
function generateExcelBuffer(data: any[]) {
  const worksheetData = data.map((customer) => {
    const batteryAmount = customer.battery_amount || 0;
    const paidAmount = customer.payment_status === "completed"
      ? batteryAmount
      : (customer.paid_amount || 0);
    const remainingBalance = batteryAmount - paidAmount;

    return {
      "Customer Name": customer.customer_name || "",
      "Remarks": customer.remarks || "",
      "Phone Number": customer.phone_number || "",
      "Vehicle Number": customer.vehicle_number || "",
      "UPS Name": customer.ups_name || "",
      "Battery Serial Number": customer.battery_serial_number || "",
      "Battery Amount": batteryAmount,
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

  const colWidths = Object.keys(worksheetData[0]).map((key) => ({
    wch: Math.max(
      key.length,
      ...worksheetData.map((row) => String(row[key as keyof typeof row]).length)
    ),
  }));
  worksheet["!cols"] = colWidths;

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });

  return excelBuffer;
}

// Helper function to build CSV buffer in memory
function generateCSVBuffer(data: any[]) {
  const headers = [
    "Customer Name",
    "Remarks",
    "Phone Number",
    "Vehicle Number",
    "UPS Name",
    "Battery Serial Number",
    "Battery Amount",
    "Paid Amount",
    "Remaining Balance",
    "Purchase Date",
    "Payment Status",
    "Created At",
  ];

  const rows = data.map((customer) => {
    const batteryAmount = customer.battery_amount || 0;
    const paidAmount = customer.payment_status === "completed"
      ? batteryAmount
      : (customer.paid_amount || 0);
    const remainingBalance = batteryAmount - paidAmount;

    return [
      customer.customer_name || "",
      customer.remarks || "",
      customer.phone_number || "",
      customer.vehicle_number || "",
      customer.ups_name || "",
      customer.battery_serial_number || "",
      batteryAmount.toString(),
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

  return Buffer.from(csvContent, "utf-8");
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the request using Supabase auth session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { exportMode, startDate, endDate, statusFilter, format } = body;

    // 3. Query customers from Supabase
    let query = supabase
      .from("customers")
      .select("*")
      .eq("is_deleted", false);

    if (exportMode === "range" && startDate && endDate) {
      query = query
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate);
    }

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("payment_status", statusFilter);
    }

    // Order by purchase_date DESC
    query = query.order("purchase_date", { ascending: false });

    const { data, error: queryError } = await query;
    if (queryError) throw queryError;

    const customers = data || [];
    if (customers.length === 0) {
      return NextResponse.json({ error: "No data found for the selected filters" }, { status: 404 });
    }

    // 4. Generate file buffer
    let fileBuffer: Buffer;
    let mimeType: string;
    let fileName: string;

    const todayStr = new Date().toISOString().split("T")[0];
    const statusSuffix = statusFilter && statusFilter !== "all" ? `-${statusFilter}` : "";
    const fileDate = exportMode === "range" ? `${startDate}_to_${endDate}` : todayStr;

    if (format === "csv") {
      fileBuffer = generateCSVBuffer(customers);
      mimeType = "text/csv";
      fileName = `battery-inventory${statusSuffix}-${fileDate}.csv`;
    } else {
      fileBuffer = generateExcelBuffer(customers);
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      fileName = `battery-inventory${statusSuffix}-${fileDate}.xlsx`;
    }

    // 5. Connect to Google Drive using Admin OAuth 2.0 or Service Account Credentials
    let auth: any;
    if (process.env.GOOGLE_REFRESH_TOKEN) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
      auth = oauth2Client;
    } else {
      const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
        ? process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/^"(.*)"$/, "$1")
        : "";

      auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
    }

    const drive = google.drive({ version: "v3", auth });

    // Convert Buffer to readable stream for Google upload
    const mediaStream = new Readable();
    mediaStream.push(fileBuffer);
    mediaStream.push(null);

    // 6. Upload file directly into the shared folder ID
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || ""],
        mimeType: mimeType,
      },
      media: {
        mimeType: mimeType,
        body: mediaStream,
      },
      fields: "id, name",
    });

    return NextResponse.json({
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
    });
  } catch (error: any) {
    console.error("Google Drive Upload Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload to Google Drive" },
      { status: 500 }
    );
  }
}
