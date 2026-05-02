import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

// GET /api/online-media/health - Check API health
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_CONFIG.onlineMedia.baseUrl}/`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json({
        status: "healthy",
        message: "Online Media Service is running",
        data,
      });
    } else {
      return NextResponse.json(
        { status: "unhealthy", message: "Service unavailable" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error checking health:", error);
    return NextResponse.json(
      { status: "unhealthy", message: "Failed to connect to service" },
      { status: 503 }
    );
  }
}
