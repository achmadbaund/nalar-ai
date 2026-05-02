import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const TOPIC_ANALYZER_URL = API_CONFIG.topicAnalyzer.url;

export async function GET(request: NextRequest) {
	try {
		const response = await fetch(`${TOPIC_ANALYZER_URL}/health`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});

		if (!response.ok) {
			return NextResponse.json({ error: `Health check failed: ${response.statusText}` }, { status: response.status });
		}

		const data = await response.json().catch(() => ({}));

		// Build standardized health response
		const result = {
			status: (data.status as string) || "healthy",
			service: (data.service as string) || "topic-analyzer-service",
			version: (data.version as string) || (data?.info?.version as string) || "unknown",
		};

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		console.error("Error checking topic-analyzer health:", error);

		if (error instanceof TypeError && error.message.includes("fetch")) {
			return NextResponse.json(
				{ error: `Cannot connect to topic-analyzer service at ${TOPIC_ANALYZER_URL}. Please ensure the service is running.` },
				{ status: 503 },
			);
		}

		return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to check health" }, { status: 500 });
	}
}
