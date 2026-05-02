import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const MODEL_MANAGEMENT_URL = API_CONFIG.modelManagement.url;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const url = new URL(`${MODEL_MANAGEMENT_URL}/api/v1/models/convert/onnx`);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to convert model to ONNX" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("ONNX conversion error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Model Management service" },
      { status: 500 }
    );
  }
}
