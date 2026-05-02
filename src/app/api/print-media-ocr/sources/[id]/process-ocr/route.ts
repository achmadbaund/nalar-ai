import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BASE_URL = API_CONFIG.printMediaOcr.url;

// POST /api/print-media-ocr/sources/[id]/process-ocr - Process OCR
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Mock response when backend is not available
    if (!BASE_URL || BASE_URL.includes("localhost") || BASE_URL.includes("undefined")) {
      const uploadSources = (global as any).uploadSources || [];
      const source = uploadSources.find((s: any) => s.id === parseInt(id));
      if (source) {
        // Simulate processing - return success
        return NextResponse.json({
          id: source.id,
          ocr_status: "completed",
          message: "OCR processing completed successfully (mock)",
        }, { status: 200 });
      }
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const response = await fetch(`${BASE_URL}/sources/${id}/process_ocr/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
    console.error("Error processing OCR:", error);
    return NextResponse.json(
      {
        error: "Failed to process OCR",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
