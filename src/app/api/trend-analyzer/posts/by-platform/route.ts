import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const platform = searchParams.get("platform");
  const limit = searchParams.get("limit") || "5";

  if (!startDate || !endDate || !platform) {
    return NextResponse.json(
      { error: "Missing required parameters: start_date, end_date, platform" },
      { status: 400 }
    );
  }

  const response = await fetch(
    `${API_CONFIG.trendAnalyzer.url}/posts/by-platform?` +
    `start_date=${startDate}&end_date=${endDate}&platform=${encodeURIComponent(platform)}&limit=${limit}`
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch posts by platform" },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
