import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BASE_URL = API_CONFIG.printMediaOcr.url;

// POST /api/print-media-ocr/articles/[id]/validate - Validate article
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Mock response when backend is not available
    if (!BASE_URL || BASE_URL.includes("localhost") || BASE_URL.includes("undefined")) {
      const uploadArticles = (global as any).uploadArticles || [];
      const article = uploadArticles.find((a: any) => a.id === parseInt(id));
      if (article) {
        article.validated = true;
        return NextResponse.json({ ...article, validated: true }, { status: 200 });
      }
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const response = await fetch(`${BASE_URL}/articles/${id}/validate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    console.error("Error validating article:", error);
    return NextResponse.json(
      {
        error: "Failed to validate article",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
