import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const TREND_ANALYZER_URL = API_CONFIG.trendAnalyzer.url;

export async function GET(request: NextRequest) {
  try {
    // Call root endpoint to get service info
    const url = new URL(`${TREND_ANALYZER_URL}/`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to get service info" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Trend Analyzer service info error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Trend Analyzer service" },
      { status: 500 }
    );
  }
}
