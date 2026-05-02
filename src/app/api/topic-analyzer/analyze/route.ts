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

		console.log("Analyze request body:", body);

		const { content_id, text, content_type = "news" } = body as { content_id?: unknown; text?: unknown; content_type?: unknown };

		// Validation
		const contentIdNum = Number(content_id);
		if (!Number.isInteger(contentIdNum) || contentIdNum <= 0) {
			return NextResponse.json({ error: "content_id must be a positive integer" }, { status: 422 });
		}

		if (typeof text !== "string" || text.trim().length === 0) {
			return NextResponse.json({ error: "text must be a non-empty string" }, { status: 422 });
		}

		const headers = extractAuthHeader(request);

		// 1. Call V2 classification endpoint (Levels 1 classification)
		const classifyResponse = await fetch(`${TOPIC_ANALYZER_URL}/api/v1/classify/article`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				content_id: contentIdNum,
				text,
				content_type: content_type,
				save: true
			}),
		});

		if (classifyResponse.status === 429) {
			return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
		}

		if (!classifyResponse.ok) {
			const err = await classifyResponse.json().catch(() => ({ error: "Upstream error during classification" }));
			console.error("Classification error:", err);
			return NextResponse.json(err, { status: classifyResponse.status });
		}

		const classifyData = await classifyResponse.json();

		// 2. Call V2 hierarchy endpoint to get the full tree (Topics > Subtopics > Stories)
		// This will include the topics we just classified, plus any subtopics/stories if they exist
		const hierarchyResponse = await fetch(`${TOPIC_ANALYZER_URL}/api/v1/topics/articles/${contentIdNum}/hierarchy?content_type=${content_type}`, {
			method: "GET",
			headers
		});

		if (!hierarchyResponse.ok) {
			console.warn("Failed to fetch hierarchy, returning partial results:", hierarchyResponse.status);
			// Fallback to just returning the classify data if hierarchy fetch fails
			return NextResponse.json({
				content_id: contentIdNum,
				topics: classifyData.topics.map((t: any) => ({
					topic_name: t.topic_slug,
					confidence: t.confidence_score,
					description: t.model_version
				})),
				total_topics: classifyData.topics.length,
				hierarchy: null
			}, { status: 200 });
		}

		const hierarchyData = await hierarchyResponse.json();

		// Return combined result
		return NextResponse.json({
			content_id: contentIdNum,
			content_type: content_type,
			// Keep flattened topics for backward compatibility if needed, but primary data is hierarchy
			topics: hierarchyData.topics.map((t: any) => ({
				topic_name: t.slug,
				confidence: t.confidence_score,
				id: t.id
			})),
			total_topics: hierarchyData.topics.length,
			hierarchy: hierarchyData // Full hierarchical structure: { topics, subtopics, stories }
		}, { status: 200 });

	} catch (error) {
		console.error("Error in topic-analyzer analyze:", error);
		if (error instanceof TypeError && error.message.includes("fetch")) {
			return NextResponse.json(
				{ error: `Cannot connect to topic-analyzer service at ${TOPIC_ANALYZER_URL}. Please ensure the service is running.` },
				{ status: 503 },
			);
		}
		return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to analyze topics" }, { status: 500 });
	}
}
