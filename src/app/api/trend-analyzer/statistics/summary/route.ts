import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const TREND_ANALYZER_URL = API_CONFIG.trendAnalyzer.url;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(`${TREND_ANALYZER_URL}/api/v1/trend/results`);

    // Get all trend results and calculate summary statistics
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
        { error: errorData.detail || "Failed to get trend statistics" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Calculate summary statistics from the results
    const results = Array.isArray(data) ? data : [];
    const totalTrends = results.length;
    const totalSpikes = results.filter((r: any) => r.has_spike).length;

    // Count trend types
    const trendTypeCounts = results.reduce(
      (acc: any, r: any) => {
        acc[r.trend_type] = (acc[r.trend_type] || 0) + 1;
        return acc;
      },
      { upward: 0, downward: 0, stable: 0 }
    );

    const mostCommonTrendType =
      Object.entries(trendTypeCounts).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || "stable";

    // Get date range
    const dates = results.map((r: any) => new Date(r.date)).sort((a, b) => a.getTime() - b.getTime());
    const dateRange =
      dates.length > 0
        ? {
            earliest: dates[0].toISOString().split("T")[0],
            latest: dates[dates.length - 1].toISOString().split("T")[0],
          }
        : null;

    const summary = {
      total_trends_detected: totalTrends,
      total_spikes_detected: totalSpikes,
      most_common_trend_type: mostCommonTrendType,
      date_range: dateRange,
      trend_type_counts: trendTypeCounts,
    };

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error("Trend statistics error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Trend Analyzer service" },
      { status: 500 }
    );
  }
}
