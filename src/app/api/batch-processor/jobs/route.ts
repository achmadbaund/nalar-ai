import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BATCH_PROCESSOR_URL = API_CONFIG.batchProcessor.url;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const url = new URL(`${BATCH_PROCESSOR_URL}/api/v1/batch/jobs`);
    
    if (status) url.searchParams.set("status", status);
    if (limit) url.searchParams.set("limit", limit);
    if (offset) url.searchParams.set("offset", offset);

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
        { error: errorData.detail || `Failed to get batch jobs: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error getting batch jobs:", error);
    
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          error: `Cannot connect to batch processor service at ${BATCH_PROCESSOR_URL}. Please ensure the service is running.`,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get batch jobs",
      },
      { status: 500 },
    );
  }
}

