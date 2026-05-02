import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const url = new URL(`${API_CONFIG.aiGateway.url}/api/v1/topic/analyze`);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to classify topics" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error classifying topics:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to classify topics",
      },
      { status: 500 }
    );
  }
}
