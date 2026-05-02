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
    const name = searchParams.get("name");
    const limitParam = searchParams.get("limit");

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "name query parameter is required" }, { status: 400 });
    }

    const limit = limitParam ? Number(limitParam) : 100;
    if (!Number.isInteger(limit) || limit <= 0) {
      return NextResponse.json({ error: "limit must be a positive integer" }, { status: 422 });
    }

    const headers = extractAuthHeader(request);

    const url = new URL(`${ENTITY_SENTIMENT_URL}/api/v1/entity/search`);
    url.searchParams.set("name", name);
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Failed to search entities: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json().catch(() => null);

    const results = data && Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : (data?.results ?? []));
    const total = data && typeof data.total === "number" ? data.total : results.length;

    return NextResponse.json({ query: name, results, total }, { status: 200 });
  } catch (error) {
    console.error("Error searching entities:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: `Cannot connect to entity-sentiment service at ${ENTITY_SENTIMENT_URL}. Please ensure the service is running.` },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to search entities" }, { status: 500 });
  }
}
