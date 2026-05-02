import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const SENTIMENT_CORE_URL = API_CONFIG.sentimentCore.url;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sentiment = searchParams.get("sentiment");
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";
    const orderBy = searchParams.get("order_by");
    const orderDir = searchParams.get("order_dir");
    const contentType = searchParams.get("content_type");
    const includeContent = searchParams.get("include_content") === "true";

    const url = new URL(`${SENTIMENT_CORE_URL}/api/v1/sentiment/results`);
    if (sentiment) url.searchParams.set("sentiment", sentiment);
    url.searchParams.set("limit", limit);
    url.searchParams.set("offset", offset);
    if (orderBy) url.searchParams.set("order_by", orderBy);
    if (orderDir) url.searchParams.set("order_dir", orderDir);
    if (contentType) url.searchParams.set("content_type", contentType);

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
        { error: errorData.detail || `Failed to fetch results: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    // If include_content is true, fetch content from source tables
    if (includeContent && data.results && Array.isArray(data.results)) {
      const resultsWithContent = await Promise.all(
        data.results.map(async (result: any) => {
          try {
            // Fetch content from cleaning backend using content_id
            const contentUrl = `${API_CONFIG.cleaningBackend.url}/cleaned-content/${result.content_id}`;
            const contentRes = await fetch(contentUrl, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              cache: "no-store",
            });

            if (contentRes.ok) {
              const contentData = await contentRes.json();
              // Merge sentiment result with content data
              return {
                ...result,
                content: contentData.content || contentData.text || "",
                title: contentData.title || null,
                source: contentData.source || null,
                date: contentData.date || contentData.created_at || null,
                content_type: contentData.content_type || null,
              };
            }
            return result;
          } catch (err) {
            console.error(`Failed to fetch content for ${result.content_id}:`, err);
            return result;
          }
        })
      );
      data.results = resultsWithContent;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch results",
      },
      { status: 500 },
    );
  }
}

