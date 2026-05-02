import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const MODEL_MANAGEMENT_URL = API_CONFIG.modelManagement.url;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const url = new URL(`${MODEL_MANAGEMENT_URL}/api/v1/models/compare`);

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
        { error: errorData.detail || "Failed to compare models" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform backend response to match frontend interface
    // Backend returns: { model1, model2, differences }
    // Frontend expects: { model_name, version1, version2, comparison }
    const transformed = {
      model_name: body.model_name,
      version1: {
        version: data.model1.version,
        format: data.model1.format,
        file_size_mb: data.model1.file_size_mb,
        accuracy_score: data.model1.accuracy_score,
        created_at: data.model1.created_at || new Date().toISOString(),
      },
      version2: {
        version: data.model2.version,
        format: data.model2.format,
        file_size_mb: data.model2.file_size_mb,
        accuracy_score: data.model2.accuracy_score,
        created_at: data.model2.created_at || new Date().toISOString(),
      },
      comparison: {
        size_diff_mb: data.differences.size_diff_mb,
        size_diff_percent: data.model1.file_size_mb > 0
          ? ((data.differences.size_diff_mb / data.model1.file_size_mb) * 100)
          : 0,
        accuracy_diff: data.differences.accuracy_diff,
        accuracy_improvement: data.differences.accuracy_diff > 0,
      },
    };

    return NextResponse.json(transformed, { status: 200 });
  } catch (error) {
    console.error("Model comparison error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Model Management service" },
      { status: 500 }
    );
  }
}
