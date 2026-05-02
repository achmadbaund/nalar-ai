import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const API_URL = API_CONFIG.cleaningBackend.url;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get("content_type") || "news";

    const response = await fetch(
      `${API_URL}/public/cleaning/sample-data/${id}?content_type=${contentType}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to fetch sample" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching sample:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sample" },
      { status: 500 }
    );
  }
}
