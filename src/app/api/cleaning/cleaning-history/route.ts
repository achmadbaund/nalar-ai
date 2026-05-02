import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const API_URL = API_CONFIG.cleaningBackend.url;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const componentId = searchParams.get("component_id") || "";
    const limit = searchParams.get("limit") || "20";

    const url = new URL(`${API_URL}/public/cleaning/cleaning-history/`);
    if (componentId) url.searchParams.set("component_id", componentId);
    url.searchParams.set("limit", limit);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to fetch history" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch history" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get("id");

    if (!historyId) {
      return NextResponse.json(
        { error: "History ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_URL}/public/cleaning/cleaning-history/`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to delete history" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting history:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete history" },
      { status: 500 }
    );
  }
}
