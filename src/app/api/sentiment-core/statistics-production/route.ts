import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const SENTIMENT_CORE_URL = API_CONFIG.sentimentCore.url;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const url = new URL(`${SENTIMENT_CORE_URL}/api/v1/sentiment/statistics`);
    if (dateFrom) url.searchParams.set("date_from", dateFrom);
    if (dateTo) url.searchParams.set("date_to", dateTo);

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
        { error: errorData.detail || `Failed to fetch statistics: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
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

