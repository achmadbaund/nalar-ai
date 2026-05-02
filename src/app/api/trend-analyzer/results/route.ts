import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const TREND_ANALYZER_URL = API_CONFIG.trendAnalyzer.url;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const trendType = searchParams.get("trend_type");
    const hasSpike = searchParams.get("has_spike");
    const hasAnomaly = searchParams.get("has_anomaly");

    const url = new URL(`${TREND_ANALYZER_URL}/api/v1/trend/results`);
    if (date) url.searchParams.set("date", date);
    if (startDate) url.searchParams.set("start_date", startDate);
    if (endDate) url.searchParams.set("end_date", endDate);
    if (trendType) url.searchParams.set("trend_type", trendType);
    if (hasSpike !== null) url.searchParams.set("has_spike", hasSpike);
    if (hasAnomaly !== null) url.searchParams.set("has_anomaly", hasAnomaly);

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
        { error: errorData.detail || "Failed to get trend results" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Trend results error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Trend Analyzer service" },
      { status: 500 }
    );
  }
}
