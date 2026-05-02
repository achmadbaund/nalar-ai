import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const MODEL_MANAGEMENT_URL = API_CONFIG.modelManagement.url;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const modelType = searchParams.get("model_type");
    const isActive = searchParams.get("is_active");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const url = new URL(`${MODEL_MANAGEMENT_URL}/api/v1/models`);
    if (modelType) url.searchParams.set("model_type", modelType);
    if (isActive !== null) url.searchParams.set("is_active", isActive);
    if (limit) url.searchParams.set("limit", limit);
    if (offset) url.searchParams.set("offset", offset);

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
        { error: errorData.detail || "Failed to get models" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Models list error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Model Management service" },
      { status: 500 }
    );
  }
}
