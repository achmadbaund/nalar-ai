import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const POSTS_URL = `${API_CONFIG.apifySocial.url}/api/v1/posts`;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";
    const platform = searchParams.get("platform");
    const username = searchParams.get("username");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const postedStartDate = searchParams.get("posted_start_date");
    const postedEndDate = searchParams.get("posted_end_date");
    const createdStartDate = searchParams.get("created_start_date");
    const createdEndDate = searchParams.get("created_end_date");

    const url = new URL(POSTS_URL);
    url.searchParams.set("limit", limit);
    url.searchParams.set("offset", offset);
    if (platform) url.searchParams.set("platform", platform);
    if (username) url.searchParams.set("username", username);
    if (startDate) url.searchParams.set("start_date", startDate);
    if (endDate) url.searchParams.set("end_date", endDate);
    if (postedStartDate) url.searchParams.set("posted_start_date", postedStartDate);
    if (postedEndDate) url.searchParams.set("posted_end_date", postedEndDate);
    if (createdStartDate) url.searchParams.set("created_start_date", createdStartDate);
    if (createdEndDate) url.searchParams.set("created_end_date", createdEndDate);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch posts: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch posts",
      },
      { status: 500 },
    );
  }
}

