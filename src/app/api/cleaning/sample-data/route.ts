import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const API_URL = API_CONFIG.cleaningBackend.url;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get("content_type") || "news";
    const source = searchParams.get("source");
    const limit = searchParams.get("limit") || "10";

    const url = new URL(`${API_URL}/public/cleaning/sample-data`);
    url.searchParams.set("content_type", contentType);
    if (source) url.searchParams.set("source", source);
    url.searchParams.set("limit", limit);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to fetch sample data" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching sample data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sample data" },
      { status: 500 }
    );
  }
}
