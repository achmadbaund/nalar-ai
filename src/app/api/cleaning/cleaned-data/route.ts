import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const API_URL = API_CONFIG.cleaningBackend.url;

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const content_type = searchParams.get("content_type") || "";
        const limit = searchParams.get("limit") || "20";
        const offset = searchParams.get("offset") || "0";

        const url = new URL(`${API_URL}/public/cleaning/cleaning-history/`);
        if (content_type) url.searchParams.set("content_type", content_type);
        url.searchParams.set("limit", limit);
        url.searchParams.set("offset", offset);

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        const text = await response.text();
        let data: unknown;
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            console.error("[cleaned-data] Backend returned non-JSON:", text.slice(0, 200));
            return NextResponse.json(
                {
                    error: response.ok
                        ? "Invalid response from backend"
                        : `Backend error (${response.status}): ${response.statusText}`,
                },
                { status: response.ok ? 500 : response.status }
            );
        }

        if (!response.ok) {
            return NextResponse.json(
                { error: (data as { detail?: string }).detail || "Failed to fetch cleaned data" },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching cleaned data:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch cleaned data" },
            { status: 500 }
        );
    }
}
