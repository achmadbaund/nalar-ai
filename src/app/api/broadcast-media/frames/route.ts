/**
 * Broadcast Media - Frames API Route
 * GET: List all video frames
 */
import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params = new URLSearchParams();

    // Forward query parameters
    const page = searchParams.get("page");
    const pageSize = searchParams.get("page_size");
    const transcript = searchParams.get("transcript");
    const extractionMethod = searchParams.get("extraction_method");
    const isKeyframe = searchParams.get("is_keyframe");
    const ordering = searchParams.get("ordering");

    if (page) params.set("page", page);
    if (pageSize) params.set("page_size", pageSize);
    if (transcript) params.set("transcript", transcript);
    if (extractionMethod) params.set("extraction_method", extractionMethod);
    if (isKeyframe) params.set("is_keyframe", isKeyframe);
    if (ordering) params.set("ordering", ordering);

    const url = `${API_CONFIG.broadcastMedia.url}/frames/?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await response.text();

    // Check if response is HTML (error page)
    if (text.trim().startsWith("<!") || text.trim().startsWith("<html")) {
      console.error(
        "Backend returned HTML instead of JSON:",
        text.substring(0, 200)
      );
      return NextResponse.json(
        {
          error: "Backend service error",
          results: [],
          count: 0,
        },
        { status: 502 }
      );
    }

    try {
      const data = JSON.parse(text);
      if (!response.ok) {
        return NextResponse.json(
          { error: data.detail || data.error || "Failed to fetch frames" },
          { status: response.status }
        );
      }
      return NextResponse.json(data);
    } catch (parseError) {
      console.error("Failed to parse response:", text.substring(0, 200));
      return NextResponse.json(
        {
          error: "Invalid response from backend",
          results: [],
          count: 0,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Error fetching frames:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service", results: [], count: 0 },
      { status: 503 }
    );
  }
}
