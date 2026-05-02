import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const ASPECT_SENTIMENT_URL = API_CONFIG.aspectSentiment.url;

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${ASPECT_SENTIMENT_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Health check failed: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error checking health:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to check health",
      },
      { status: 500 },
    );
  }
}

