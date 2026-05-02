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

export async function POST(request: NextRequest) {
	try {
		const body = await request.json().catch(() => null);

		if (!body) {
			return NextResponse.json({ error: "Missing JSON body" }, { status: 400 });
		}

		const { items } = body as { items?: unknown };

		// Validation
		if (!Array.isArray(items)) {
			return NextResponse.json({ error: "items must be an array" }, { status: 422 });
		}

		if (items.length === 0) {
			return NextResponse.json({ error: "items array cannot be empty" }, { status: 422 });
		}

		// Validate each item
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (!item || typeof item !== "object") {
				return NextResponse.json({ error: `items[${i}] must be an object` }, { status: 422 });
			}

			const contentIdNum = Number(item.content_id);
			if (!Number.isInteger(contentIdNum) || contentIdNum <= 0) {
				return NextResponse.json({ error: `items[${i}].content_id must be a positive integer` }, { status: 422 });
			}

			if (typeof item.text !== "string" || item.text.trim().length === 0) {
				return NextResponse.json({ error: `items[${i}].text must be a non-empty string` }, { status: 422 });
			}
		}

		const headers = extractAuthHeader(request);

		const response = await fetch(`${TOPIC_ANALYZER_URL}/api/v1/topic/analyze/batch`, {
			method: "POST",
			headers,
			body: JSON.stringify({ items }),
		});

		// Rate limit
		if (response.status === 429) {
			const retryAfter = response.headers.get("retry-after");
			const msg = { error: "Rate limit exceeded", retry_after: retryAfter };
			return NextResponse.json(msg, { status: 429 });
		}

		// Forward common status codes
		if (response.status === 401) {
			const err = await response.json().catch(() => ({ error: "Unauthorized" }));
			return NextResponse.json(err, { status: 401 });
		}

		if (response.status === 422) {
			const err = await response.json().catch(() => ({ error: "Validation error" }));
			return NextResponse.json(err, { status: 422 });
		}

		if (response.status === 504) {
			return NextResponse.json({ error: "Batch topic analysis timeout" }, { status: 504 });
		}

		if (!response.ok) {
			const err = await response.json().catch(() => ({ error: response.statusText || "Upstream error" }));
			return NextResponse.json(err, { status: response.status });
		}

		const data = await response.json();

		return NextResponse.json(data, { status: 200 });
	} catch (error) {
		console.error("Error in topic-analyzer batch analyze:", error);
		if (error instanceof TypeError && error.message.includes("fetch")) {
			return NextResponse.json(
				{ error: `Cannot connect to topic-analyzer service at ${TOPIC_ANALYZER_URL}. Please ensure the service is running.` },
				{ status: 503 },
			);
		}
		return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to batch analyze topics" }, { status: 500 });
	}
}
