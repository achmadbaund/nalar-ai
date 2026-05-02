import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const EMOTION_DETECTION_URL = API_CONFIG.emotionDetection.url;

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
      `${EMOTION_DETECTION_URL}/api/v1/emotion/results/${contentId}`,
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
        { error: errorData.detail || `Failed to get emotion results: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error getting emotion results:", error);
    
    // Handle fetch errors more specifically
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error: `Cannot connect to emotion detection service at ${EMOTION_DETECTION_URL}. Please ensure the service is running.`,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get emotion results",
      },
      { status: 500 },
    );
  }
}

