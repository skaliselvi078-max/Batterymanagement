import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateCSVString } from "@/lib/export";

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Fetch all customers (including soft-deleted for full backup, paginated to bypass 1000 max rows limit)
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

    // Generate CSV
    const csvContent = generateCSVString(customers);
    const fileName = `backup-${new Date().toISOString().split("T")[0]}.csv`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(fileName, csvContent, {
        contentType: "text/csv",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Backup created: ${fileName}`,
      records: customers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
