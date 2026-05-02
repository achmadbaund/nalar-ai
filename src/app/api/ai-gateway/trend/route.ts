import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const AI_GATEWAY_URL = API_CONFIG.aiGateway.url;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "start and end date parameters are required (format: YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const url = new URL(`${AI_GATEWAY_URL}/api/v1/trend/analyze`);
    url.searchParams.set("start", startDate);
    url.searchParams.set("end", endDate);

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
        { error: errorData.detail || "Failed to analyze trends" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Trend analyze error:", error);
    return NextResponse.json(
      { error: "Failed to connect to AI Gateway service" },
      { status: 500 }
    );
  }
}
