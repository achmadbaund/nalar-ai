import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const EMOTION_DETECTION_URL = API_CONFIG.emotionDetection.url;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const skip = searchParams.get("skip") || "0";
    const limit = searchParams.get("limit") || "50";
    const dominantEmotion = searchParams.get("dominant_emotion");

    const url = new URL(`${EMOTION_DETECTION_URL}/api/v1/emotion/results`);
    url.searchParams.set("skip", skip);
    url.searchParams.set("limit", limit);
    if (dominantEmotion) {
      url.searchParams.set("dominant_emotion", dominantEmotion);
    }

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

