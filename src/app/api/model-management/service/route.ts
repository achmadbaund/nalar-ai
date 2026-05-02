import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const MODEL_MANAGEMENT_URL = API_CONFIG.modelManagement.url;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(`${MODEL_MANAGEMENT_URL}/`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to get service info" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Model Management service info error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Model Management service" },
      { status: 500 }
    );
  }
}
