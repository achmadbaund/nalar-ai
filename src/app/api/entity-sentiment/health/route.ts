import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const ENTITY_SENTIMENT_URL = API_CONFIG.entitySentiment.url;

async function checkCleanedContentTable(): Promise<boolean> {
	// Try a sensible endpoint that could expose whether the cleaned_content table exists.
	// If the backend doesn't implement it, treat as false rather than throwing.
	try {
		const url = `${ENTITY_SENTIMENT_URL}/api/v1/cleaned_content/exists`;
		const res = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
		if (!res.ok) return false;
		const json = await res.json().catch(() => null);
		// Accept either { exists: true } or boolean response `true`/`false`
		if (json === null) return false;
		if (typeof json === "boolean") return json;
		if (typeof json === "object" && json.hasOwnProperty("exists")) return Boolean((json as any).exists);
		return false;
	} catch (e) {
		return false;
	}
}

export async function GET(request: NextRequest) {
	try {
		const response = await fetch(`${ENTITY_SENTIMENT_URL}/health`, {
			method: "GET",
			headers: { "Content-Type": "application/json" },
		});

		if (!response.ok) {
			return NextResponse.json({ error: `Health check failed: ${response.statusText}` }, { status: response.status });
		}

		const data = await response.json().catch(() => ({}));

		// Determine cleaned_content table presence (best-effort)
		const cleanedPresent = await checkCleanedContentTable();

		// Build final response to match requested shape
		const result = {
			status: (data.status as string) || "healthy",
			service: (data.service as string) || "entity-sentiment-service",
			version: (data.version as string) || (data?.info?.version as string) || "unknown",
			dependencies: {
				cleaned_content_table_present: cleanedPresent,
			},
		};

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		console.error("Error checking entity-sentiment health:", error);

		if (error instanceof TypeError && error.message.includes("fetch")) {
			return NextResponse.json(
				{ error: `Cannot connect to entity-sentiment service at ${ENTITY_SENTIMENT_URL}. Please ensure the service is running.` },
				{ status: 503 },
			);
		}

		return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to check health" }, { status: 500 });
	}
}

