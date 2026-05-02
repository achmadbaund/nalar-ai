import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BASE_URL = API_CONFIG.onlineMedia.url;

// GET /api/online-media/sources - List all news sources with pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${BASE_URL}/sources/${queryString ? `?${queryString}` : ""}`;

    console.log("Fetching sources from:", url);

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    // Check if response is ok before parsing
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching news sources:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch news sources",
        details: error instanceof Error ? error.message : String(error),
        backendUrl: BASE_URL,
      },
      { status: 500 }
    );
  }
}

// POST /api/online-media/sources - Create a new news source
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${BASE_URL}/sources/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating news source:", error);
    return NextResponse.json(
      {
        error: "Failed to create news source",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
