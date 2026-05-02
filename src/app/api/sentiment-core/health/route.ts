import { NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const SENTIMENT_CORE_URL = API_CONFIG.sentimentCore.url;

export async function GET() {
  try {
    const response = await fetch(`${SENTIMENT_CORE_URL}/api/v1/sentiment/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Failed to fetch health: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching sentiment core health:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch health",
      },
      { status: 500 },
    );
  }
}

