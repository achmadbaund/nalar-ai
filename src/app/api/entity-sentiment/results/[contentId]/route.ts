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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;

    if (!contentId) {
      return NextResponse.json({ error: "content_id is required" }, { status: 400 });
    }

    const idNum = Number(contentId);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return NextResponse.json({ error: "content_id must be a positive integer" }, { status: 422 });
    }

    const headers = extractAuthHeader(request);

    const response = await fetch(
      `${ENTITY_SENTIMENT_URL}/api/v1/entity/results/${idNum}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    );

    if (response.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || `Failed to fetch entity results: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Ensure response shape includes content_id and results array
    const result = {
      content_id: idNum,
      results: Array.isArray(data.results) ? data.results : data,
      created_at: data.created_at || data.createdAt || null,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error getting entity results:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: `Cannot connect to entity-sentiment service at ${ENTITY_SENTIMENT_URL}. Please ensure the service is running.` },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to get entity results" }, { status: 500 });
  }
}
