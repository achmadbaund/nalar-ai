import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const ASPECT_SENTIMENT_URL = API_CONFIG.aspectSentiment.url;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;

    if (!contentId) {
      return NextResponse.json(
        { error: "content_id is required" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${ASPECT_SENTIMENT_URL}/api/v1/aspect/results/${contentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Failed to get aspect results: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error getting aspect results:", error);
    
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
          error instanceof Error ? error.message : "Failed to get aspect results",
      },
      { status: 500 },
    );
  }
}

