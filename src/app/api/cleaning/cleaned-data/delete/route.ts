import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const API_URL = API_CONFIG.cleaningBackend.url;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids array is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/public/cleaning/cleaned-data/delete/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to delete cleaned data" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting cleaned data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete cleaned data" },
      { status: 500 }
    );
  }
}
