import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BASE_URL = API_CONFIG.onlineMedia.url;

// GET /api/online-media/jobs - Get list of crawl jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    // Forward query parameters
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    const response = await fetch(`${BASE_URL}/jobs/${params.toString() ? `?${params.toString()}` : ''}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch crawl jobs", status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching crawl jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
