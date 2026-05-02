import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get("target_date");
  const limit = searchParams.get("limit") || "50";

  if (!targetDate) {
    return NextResponse.json(
      { error: "Missing required parameter: target_date" },
      { status: 400 }
    );
  }

  const response = await fetch(
    `${API_CONFIG.trendAnalyzer.url}/posts/by-date?` +
    `target_date=${targetDate}&limit=${limit}`
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch posts by date" },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
