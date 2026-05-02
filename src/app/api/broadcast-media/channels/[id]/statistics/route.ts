/**
 * Broadcast Media - Channel Statistics API Route
 * GET: Get statistics for a specific channel
 */
import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const response = await fetch(
      `${API_CONFIG.broadcastMedia.url}/channels/${id}/statistics/`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to fetch statistics" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching channel statistics:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service" },
      { status: 503 }
    );
  }
}
