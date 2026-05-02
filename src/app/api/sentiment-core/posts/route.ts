import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const SENTIMENT_CORE_URL = API_CONFIG.sentimentCore.url;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get("platform");
    const sentiment = searchParams.get("sentiment");
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";
    const orderBy = searchParams.get("order_by");
    const orderDir = searchParams.get("order_dir");

    const url = new URL(`${SENTIMENT_CORE_URL}/api/v1/sentiment/poc/posts`);
    if (platform) url.searchParams.set("platform", platform);
    if (sentiment) url.searchParams.set("sentiment", sentiment);
    url.searchParams.set("limit", limit);
    url.searchParams.set("offset", offset);
    if (orderBy) url.searchParams.set("order_by", orderBy);
    if (orderDir) url.searchParams.set("order_dir", orderDir);

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
        { error: errorData.detail || `Failed to fetch posts: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
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

