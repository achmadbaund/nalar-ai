import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const TREND_ANALYZER_URL = API_CONFIG.trendAnalyzer.url;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const url = new URL(`${TREND_ANALYZER_URL}/api/v1/trend/aggregate`);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to aggregate sentiment data" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Sentiment aggregation error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Trend Analyzer service" },
      { status: 500 }
    );
  }
}
