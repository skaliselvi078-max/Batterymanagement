import { NextResponse } from "next/server";
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

export async function GET(request: Request) {
  // 1. Verify the request is from Vercel Cron or authorized scheduler
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // 2. Fetch all customers (including soft-deleted for full monthly backup, paginated to bypass 1000 max rows limit)
    let customers: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error: fetchError } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (fetchError) {
        return NextResponse.json(
          { success: false, error: fetchError.message },
          { status: 500 }
        );
      }

      if (data && data.length > 0) {
        customers = [...customers, ...data];
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No data to backup",
        timestamp: new Date().toISOString(),
      });
    }

    // 3. Generate Excel file buffer
    const fileBuffer = generateExcelBuffer(customers);
    const fileName = `monthly-backup-${new Date().toISOString().split("T")[0]}.xlsx`;
    const mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    // 4. Connect to Google Drive using Admin OAuth 2.0 or Service Account Credentials
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

    // 5. Upload file directly into the shared folder ID
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
      records: customers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Google Drive Auto-Backup Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to auto-backup to Google Drive" },
      { status: 500 }
    );
  }
}
