import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const EMOTION_DETECTION_URL = API_CONFIG.emotionDetection.url;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${EMOTION_DETECTION_URL}/api/v1/emotion/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content_id: body.content_id,
        text: body.text,
        content_type: body.content_type || "social_media" // Default to social_media if missing
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Failed to analyze emotion: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error analyzing emotion:", error);

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
          error instanceof Error ? error.message : "Failed to analyze emotion",
      },
      { status: 500 },
    );
  }
}

