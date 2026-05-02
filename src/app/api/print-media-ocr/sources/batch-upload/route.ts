import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BASE_URL = API_CONFIG.printMediaOcr.url;

// POST /api/print-media-ocr/sources/batch-upload - Batch upload sources
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const response = await fetch(`${BASE_URL}/sources/batch_upload/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error batch uploading sources:", error);
    return NextResponse.json(
      {
        error: "Failed to batch upload sources",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
