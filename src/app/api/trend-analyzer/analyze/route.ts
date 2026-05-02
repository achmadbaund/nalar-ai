import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const TREND_ANALYZER_URL = API_CONFIG.trendAnalyzer.url;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const targetDate = searchParams.get("target_date");
    const granularity = searchParams.get("granularity");

    const url = new URL(`${TREND_ANALYZER_URL}/api/v1/trend/analyze`);
    if (startDate) url.searchParams.set("start_date", startDate);
    if (endDate) url.searchParams.set("end_date", endDate);
    if (targetDate) url.searchParams.set("target_date", targetDate);
    if (granularity) url.searchParams.set("granularity", granularity);
    url.searchParams.set("include_breakdowns", "true"); // Always include breakdowns for feature extraction clarity

    console.log("Calling backend URL:", url.toString());

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
        { error: errorData.detail || "Failed to analyze trends" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Trend analyze error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Trend Analyzer service" },
      { status: 500 }
    );
  }
}
