import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BASE_URL = API_CONFIG.onlineMedia.url;

// GET /api/online-media/articles - List all raw articles with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${BASE_URL}/articles/${queryString ? `?${queryString}` : ""}`;

    console.log("Fetching articles from:", url);

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    // Get response as text first to check content type
    const responseText = await response.text();

    // Check if response is HTML (not JSON)
    if (
      responseText.trim().startsWith("<!") ||
      responseText.trim().startsWith("<html")
    ) {
      console.error(
        "Backend returned HTML instead of JSON:",
        responseText.substring(0, 200)
      );
      return NextResponse.json(
        {
          error:
            "Backend service returned HTML instead of JSON. The articles endpoint might not be available.",
          results: [],
          count: 0,
        },
        { status: 503 }
      );
    }

    // Check if response is ok before parsing
    if (!response.ok) {
      console.error("Backend error:", response.status, responseText);
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: responseText },
        { status: response.status }
      );
    }

    // Try to parse JSON
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: response.status });
    } catch (parseError) {
      console.error(
        "Failed to parse JSON:",
        parseError,
        "Response:",
        responseText.substring(0, 500)
      );
      return NextResponse.json(
        {
          error: "Failed to parse response as JSON",
          results: [],
          count: 0,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch articles",
        details: error instanceof Error ? error.message : String(error),
        backendUrl: BASE_URL,
        results: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
