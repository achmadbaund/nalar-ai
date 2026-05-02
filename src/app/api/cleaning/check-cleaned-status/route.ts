import { NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { ids, source_type } = body;

        if (!ids || !source_type) {
            return NextResponse.json(
                { error: "Missing required fields: ids, source_type" },
                { status: 400 }
            );
        }

        const apiUrl = API_CONFIG.cleaningBackend.url;
        const response = await fetch(`${apiUrl}/public/cleaning/check-cleaned-status/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ids, source_type }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { error: data.error || "Failed to check cleaned status" },
                { status: response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in check-cleaned-status proxy:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
