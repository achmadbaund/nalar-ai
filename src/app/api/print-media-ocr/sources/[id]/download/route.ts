import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BASE_URL = API_CONFIG.printMediaOcr.url;

// GET /api/print-media-ocr/sources/[id]/download - Download source file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${BASE_URL}/sources/${id}/download/`, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    // Stream the file
    const blob = await response.blob();
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = response.headers.get("content-disposition") || `attachment; filename="source-${id}.pdf"`;

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    console.error("Error downloading source:", error);
    return NextResponse.json(
      {
        error: "Failed to download source",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
