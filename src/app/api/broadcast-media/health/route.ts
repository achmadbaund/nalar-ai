/**
 * Broadcast Media - Health API Route
 * GET: Check service health
 */
import { NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

export async function GET() {
  try {
    const response = await fetch(
      `${API_CONFIG.broadcastMedia.baseUrl}/health/`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const text = await response.text();

    // Check if response is HTML (error page)
    if (text.trim().startsWith("<!") || text.trim().startsWith("<html")) {
      return NextResponse.json(
        {
          status: "error",
          error: "Backend returned HTML instead of JSON",
        },
        { status: 502 }
      );
    }

    try {
      const data = JSON.parse(text);
      if (!response.ok) {
        return NextResponse.json(
          { status: "error", error: data.detail || "Health check failed" },
          { status: response.status }
        );
      }
      return NextResponse.json(data);
    } catch {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid response from backend",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Error checking health:", error);
    return NextResponse.json(
      { status: "error", error: "Failed to connect to backend service" },
      { status: 503 }
    );
  }
}
