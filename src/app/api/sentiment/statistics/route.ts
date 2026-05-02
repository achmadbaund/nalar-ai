import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const STATISTICS_URL = `${API_CONFIG.sentimentCore.url}/api/v1/sentiment/poc/statistics`;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const url = new URL(STATISTICS_URL);
    if (platform) {
      url.searchParams.set("platform", platform);
    }
    if (dateFrom) {
      url.searchParams.set("date_from", dateFrom);
    }
    if (dateTo) {
      url.searchParams.set("date_to", dateTo);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch statistics: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch statistics",
      },
      { status: 500 },
    );
  }
}

