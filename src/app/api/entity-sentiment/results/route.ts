import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const ENTITY_SENTIMENT_URL = API_CONFIG.entitySentiment.url;

function extractAuthHeader(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  const auth = req.headers.get("authorization");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers["X-API-KEY"] = apiKey;
  if (auth) headers["Authorization"] = auth;
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // support optional pagination filters forwarded to upstream
    const qs = new URLSearchParams();
    for (const [k, v] of searchParams.entries()) {
      if (v) qs.set(k, v);
    }

    const headers = extractAuthHeader(request);

    const url = `${ENTITY_SENTIMENT_URL}/api/v1/entity/results${qs.toString() ? `?${qs.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    // Rate limit
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      const msg = { error: "Rate limit exceeded", retry_after: retryAfter };
      return NextResponse.json(msg, { status: 429 });
    }

    if (response.status === 401) {
      const err = await response.json().catch(() => ({ error: "Unauthorized" }));
      return NextResponse.json(err, { status: 401 });
    }

    if (response.status === 404) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    if (response.status === 504) {
      return NextResponse.json({ error: "Entity service timed out" }, { status: 504 });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Failed to fetch entity results: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    // If upstream returned pagination/meta, forward as-is. If upstream returned an array, wrap it.
    if (data && (data.results || data.total || data.page || data.page_size || data.total_pages)) {
      return NextResponse.json(data, { status: 200 });
    }

    if (Array.isArray(data)) {
      return NextResponse.json({ results: data }, { status: 200 });
    }

    // Fallback: try to find results-like fields
    const results = data?.results || data?.items || [];
    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("Error fetching entity results:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: `Cannot connect to entity-sentiment service at ${ENTITY_SENTIMENT_URL}. Please ensure the service is running.` },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch entity results" }, { status: 500 });
  }
}
