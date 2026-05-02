import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const TREND_ANALYZER_URL = API_CONFIG.trendAnalyzer.url;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "50";
    const offset = parseInt(searchParams.get("offset") || "0");
    const platform = searchParams.get("platform");
    const postedStartDate = searchParams.get("posted_start_date");
    const postedEndDate = searchParams.get("posted_end_date");

    if (!postedStartDate || !postedEndDate) {
      return NextResponse.json(
        { error: "posted_start_date and posted_end_date are required for analyzed posts" },
        { status: 400 },
      );
    }

    // Fetch from all platforms if no platform specified
    const platforms = platform ? [platform] : ["tiktok", "instagram", "facebook", "twitter", "youtube"];

    let allPosts: any[] = [];

    // Fetch from each platform (max limit is 50 per request)
    for (const plt of platforms) {
      const url = new URL(`${TREND_ANALYZER_URL}/api/v1/posts/by-platform`);
      url.searchParams.set("start_date", postedStartDate);
      url.searchParams.set("end_date", postedEndDate);
      url.searchParams.set("platform", plt);
      url.searchParams.set("limit", "50"); // Backend max limit is 50

      console.log(`Fetching analyzed posts from: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Platform ${plt}: received ${data.posts?.length || 0} posts`);
        if (data.posts && Array.isArray(data.posts)) {
          allPosts = allPosts.concat(data.posts);
        }
      } else {
        console.error(`Failed to fetch from ${plt}:`, response.status, response.statusText);
      }
    }

    console.log(`Total analyzed posts collected: ${allPosts.length}`);

    // Sort by posted_at descending
    allPosts.sort((a, b) => {
      const dateA = new Date(a.posted_at).getTime();
      const dateB = new Date(b.posted_at).getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const total = allPosts.length;
    const paginatedPosts = allPosts.slice(offset, offset + parseInt(limit));
    const currentPage = Math.floor(offset / parseInt(limit)) + 1;
    const totalPages = Math.ceil(total / parseInt(limit));

    return NextResponse.json({
      data: paginatedPosts,
      pagination: {
        count: paginatedPosts.length,
        current_page: currentPage,
        has_next: offset + parseInt(limit) < total,
        has_prev: offset > 0,
        limit: parseInt(limit),
        offset: offset,
        total: total,
        total_pages: totalPages,
      },
    }, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error fetching analyzed posts:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch analyzed posts",
      },
      { status: 500 },
    );
  }
}
