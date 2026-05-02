import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BATCH_PROCESSOR_URL = API_CONFIG.batchProcessor.url;

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BATCH_PROCESSOR_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Health check failed: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error checking batch processor health:", error);
    
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error: `Cannot connect to batch processor service at ${BATCH_PROCESSOR_URL}. Please ensure the service is running.`,
          status: "unhealthy",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to check health",
        status: "unhealthy",
      },
      { status: 500 },
    );
  }
}

