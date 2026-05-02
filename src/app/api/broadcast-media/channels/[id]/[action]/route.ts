/**
 * Broadcast Media - Channel Activate/Deactivate API Route
 * POST: Activate or deactivate a channel
 */
import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

interface RouteParams {
  params: Promise<{ id: string; action: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, action } = await params;

    if (action !== "activate" && action !== "deactivate") {
      return NextResponse.json(
        { error: "Invalid action. Use 'activate' or 'deactivate'" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_CONFIG.broadcastMedia.url}/channels/${id}/${action}/`,
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
        { error: data.detail || data.error || `Failed to ${action} channel` },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error with channel action:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service" },
      { status: 503 }
    );
  }
}
