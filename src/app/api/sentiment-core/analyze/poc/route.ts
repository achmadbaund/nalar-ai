import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const SENTIMENT_CORE_URL = API_CONFIG.sentimentCore.url;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${SENTIMENT_CORE_URL}/api/v1/sentiment/analyze/poc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Failed to analyze sentiment: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze sentiment",
      },
      { status: 500 },
    );
  }
}

