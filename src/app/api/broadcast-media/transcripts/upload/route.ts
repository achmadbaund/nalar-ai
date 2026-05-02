/**
 * Broadcast Media - Transcript Upload API Route
 * POST: Upload a single file for transcription
 */
import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const response = await fetch(
      `${API_CONFIG.broadcastMedia.url}/transcripts/upload/`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || data.error || "Failed to upload file" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to connect to backend service" },
      { status: 503 }
    );
  }
}
