import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const ASPECT_SENTIMENT_URL = API_CONFIG.aspectSentiment.url;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${ASPECT_SENTIMENT_URL}/api/v1/aspect/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Failed to analyze aspect sentiment: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error analyzing aspect sentiment:", error);
    
    // Handle fetch errors more specifically
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error: `Cannot connect to aspect sentiment service at ${ASPECT_SENTIMENT_URL}. Please ensure the service is running.`,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze aspect sentiment",
      },
      { status: 500 },
    );
  }
}

