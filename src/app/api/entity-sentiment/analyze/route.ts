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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Missing JSON body" }, { status: 400 });
    }

    const { content_id, text } = body as { content_id?: unknown; text?: unknown };

    // Validation
    const contentIdNum = Number(content_id);
    if (!Number.isInteger(contentIdNum) || contentIdNum <= 0) {
      return NextResponse.json({ error: "content_id must be a positive integer" }, { status: 422 });
    }

    if (typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "text must be a non-empty string" }, { status: 422 });
    }

    const headers = extractAuthHeader(request);

    const response = await fetch(`${ENTITY_SENTIMENT_URL}/api/v1/entity/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content_id: contentIdNum, text }),
    });

    // Rate limit
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      const msg = { error: "Rate limit exceeded", retry_after: retryAfter };
      return NextResponse.json(msg, { status: 429 });
    }

    // Forward common status codes and messages
    if (response.status === 401) {
      const err = await response.json().catch(() => ({ error: "Unauthorized" }));
      return NextResponse.json(err, { status: 401 });
    }

    if (response.status === 422) {
      const err = await response.json().catch(() => ({ error: "Validation error" }));
      return NextResponse.json(err, { status: 422 });
    }

    if (response.status === 504) {
      // Backend (possibly Sentiment Core) timed out
      return NextResponse.json({ error: "Sentiment Core timeout" }, { status: 504 });
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText || "Upstream error" }));
      return NextResponse.json(err, { status: response.status });
    }

    const data = await response.json().catch(() => null);

    // Normalize response shape so frontend won't crash if upstream changes shape.
    const entities = Array.isArray(data?.entities) ? data!.entities : [];
    const total_entities = typeof data?.total_entities === "number" ? data!.total_entities : entities.length;

    // Helpful server-side warning for debugging empty-entity cases. Keep logs concise and avoid exfiltrating large texts.
    if (entities.length === 0) {
      try {
        const textSample = typeof text === "string" ? text.slice(0, 200) : undefined;
        console.warn("[entity-sentiment] analyze returned 0 entities", {
          content_id: contentIdNum,
          text_length: typeof text === "string" ? text.length : undefined,
          text_sample: textSample,
          upstream_keys: data && typeof data === "object" ? Object.keys(data) : undefined,
        });
      } catch (e) {
        // ignore logging errors
      }
    }

    // Forward the normalized result. Preserve other fields from upstream but ensure entities/total_entities exist.
    const result = {
      content_id: contentIdNum,
      ...(data && typeof data === "object" ? data : {}),
      entities,
      total_entities,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error in entity-sentiment analyze:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: `Cannot connect to entity-sentiment service at ${ENTITY_SENTIMENT_URL}. Please ensure the service is running.` },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to analyze entity sentiment" }, { status: 500 });
  }
}
