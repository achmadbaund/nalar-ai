import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const TOPIC_ANALYZER_URL = API_CONFIG.topicAnalyzer.url;

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
    const qs = new URLSearchParams();
    for (const [k, v] of searchParams.entries()) {
      if (v) qs.set(k, v);
    }

    const headers = extractAuthHeader(request);

    const url = `${TOPIC_ANALYZER_URL}/api/v1/topic/results${qs.toString() ? `?${qs.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

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
      return NextResponse.json({ error: "Topic analyzer timed out" }, { status: 504 });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Failed to fetch topic results: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Normalize to { results: [...] }
    const results = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : data.results || data.topics || [];

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("Error fetching topic results:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: `Cannot connect to topic-analyzer service at ${TOPIC_ANALYZER_URL}. Please ensure the service is running.` },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch topic results" }, { status: 500 });
  }
}
