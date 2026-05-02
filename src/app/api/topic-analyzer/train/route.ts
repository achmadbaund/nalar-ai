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

		const headers = extractAuthHeader(request);

		const resp = await fetch(`${TOPIC_ANALYZER_URL}/api/v1/train`, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});

		if (resp.status === 429) {
			const retryAfter = resp.headers.get("retry-after");
			return NextResponse.json({ error: "Rate limit exceeded", retry_after: retryAfter }, { status: 429 });
		}

		if (resp.status === 401) {
			const err = await resp.json().catch(() => ({ error: "Unauthorized" }));
			return NextResponse.json(err, { status: 401 });
		}

		if (resp.status === 422) {
			const err = await resp.json().catch(() => ({ error: "Validation error" }));
			return NextResponse.json(err, { status: 422 });
		}

		if (resp.status === 504) {
			return NextResponse.json({ error: "Topic analyzer timeout" }, { status: 504 });
		}

		if (!resp.ok) {
			const err = await resp.json().catch(() => ({ error: resp.statusText || "Upstream error" }));
			return NextResponse.json(err, { status: resp.status });
		}

		const data = await resp.json().catch(() => null);

		// Forward upstream response (normalized to JSON) back to caller
		return NextResponse.json(data ?? {}, { status: 200 });
	} catch (error) {
		console.error("Error in topic-analyzer train proxy:", error);
		if (error instanceof TypeError && error.message.includes("fetch")) {
			return NextResponse.json(
				{ error: `Cannot connect to topic-analyzer service at ${TOPIC_ANALYZER_URL}.` },
				{ status: 503 },
			);
		}
		return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to proxy train request" }, { status: 500 });
	}
}


