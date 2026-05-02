/**
 * Broadcast Media - Process STT API Route
 * POST: Trigger STT processing for a transcript
 */
import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const response = await fetch(
      `${API_CONFIG.broadcastMedia.url}/transcripts/${id}/process_stt/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.detail || data.error || "Failed to trigger STT processing",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error triggering STT processing:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service" },
      { status: 503 }
    );
  }
}
