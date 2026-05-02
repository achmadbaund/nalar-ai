/**
 * Broadcast Media - Transcripts API Route
 * GET: List all transcripts
 * POST: Create new transcript
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
    const search = searchParams.get("search");
    const sttStatus = searchParams.get("stt_status");
    const channel = searchParams.get("channel");
    const fileType = searchParams.get("file_type");
    const ordering = searchParams.get("ordering");

    if (page) params.set("page", page);
    if (pageSize) params.set("page_size", pageSize);
    if (search) params.set("search", search);
    if (sttStatus) params.set("stt_status", sttStatus);
    if (channel) params.set("channel", channel);
    if (fileType) params.set("file_type", fileType);
    if (ordering) params.set("ordering", ordering);

    const url = `${
      API_CONFIG.broadcastMedia.url
    }/transcripts/?${params.toString()}`;

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
          details: "The backend returned an error page instead of JSON data",
          results: [],
          count: 0,
        },
        { status: 502 }
      );
    }

    try {
      const data = JSON.parse(text);
      if (!response.ok) {
        // Handle authentication error specifically
        if (response.status === 401 || response.status === 403) {
          return NextResponse.json(
            {
              error:
                "Backend requires authentication. Please restart/redeploy the backend service with AllowAny permissions.",
              details:
                data.detail || "Authentication credentials were not provided.",
              results: [],
              count: 0,
            },
            { status: response.status }
          );
        }
        return NextResponse.json(
          {
            error: data.detail || data.error || "Failed to fetch transcripts",
            results: [],
            count: 0,
          },
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
    console.error("Error fetching transcripts:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service", results: [], count: 0 },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${API_CONFIG.broadcastMedia.url}/transcripts/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to create transcript" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating transcript:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service" },
      { status: 503 }
    );
  }
}
