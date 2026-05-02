import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BASE_URL = API_CONFIG.onlineMedia.url;

// POST /api/online-media/sources/[id]/crawl - Trigger manual crawl for source
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${BASE_URL}/sources/${id}/crawl/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error triggering crawl:", error);
    return NextResponse.json(
      { error: "Failed to trigger crawl" },
      { status: 500 }
    );
  }
}
