import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const CRAWL_URL = `${API_CONFIG.apifySocial.url}/api/v1/crawl/batch`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(CRAWL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || `Failed to start batch crawl: ${response.statusText}` },
        { status: response.status },
      );
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error starting batch crawl:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start batch crawl",
      },
      { status: 500 },
    );
  }
}

