/**
 * Broadcast Media - Single Frame API Route
 * GET: Get frame by ID
 * DELETE: Delete frame
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
      `${API_CONFIG.broadcastMedia.url}/frames/${id}/`,
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
        { error: data.detail || data.error || "Frame not found" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching frame:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service" },
      { status: 503 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const response = await fetch(
      `${API_CONFIG.broadcastMedia.url}/frames/${id}/`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to delete frame" },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting frame:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service" },
      { status: 503 }
    );
  }
}
