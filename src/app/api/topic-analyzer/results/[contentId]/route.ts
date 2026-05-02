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

export async function GET(request: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
	try {
		const { contentId } = await params;

		if (!contentId) {
			return NextResponse.json({ error: "content_id is required" }, { status: 400 });
		}

		const idNum = Number(contentId);
		if (!Number.isInteger(idNum) || idNum <= 0) {
			return NextResponse.json({ error: "content_id must be a positive integer" }, { status: 422 });
		}

		// Get content_type from query params (default to 'news')
		const { searchParams } = new URL(request.url);
		const contentType = searchParams.get("content_type") || "news";

		const headers = extractAuthHeader(request);

		// Use the hierarchy endpoint to get the full result tree
		const response = await fetch(`${TOPIC_ANALYZER_URL}/api/v1/topics/articles/${idNum}/hierarchy?content_type=${contentType}`, {
			method: "GET",
			headers,
			cache: "no-store",
		});

		if (response.status === 404) {
			return NextResponse.json({ error: "Not found" }, { status: 404 });
		}

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return NextResponse.json(
				{ error: errorData.detail || `Failed to fetch topic results: ${response.statusText}` },
				{ status: response.status },
			);
		}

		const data = await response.json();

		const result = {
			content_id: idNum,
			content_type: contentType,
			// Keep flattened topics for backward compatibility if needed
			results: Array.isArray(data.topics) ? data.topics.map((t: any) => ({
				topic_name: t.slug,
				confidence: t.confidence_score,
				id: t.id
			})) : [],
			hierarchy: data, // Full structure
			created_at: new Date().toISOString(), // Hierarchy endpoint might not have created_at, using now or we'd need another call
		};

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		console.error("Error getting topic results:", error);
		if (error instanceof TypeError && error.message.includes("fetch")) {
			return NextResponse.json(
				{ error: `Cannot connect to topic-analyzer service at ${TOPIC_ANALYZER_URL}. Please ensure the service is running.` },
				{ status: 503 },
			);
		}

		return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to get topic results" }, { status: 500 });
	}
}
