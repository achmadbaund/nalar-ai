import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

// POST /api/print-media-ocr/articles/[id]/validate - Validate article
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (process.env.POSTGRES_URL) {
      const result = await queryOne(
        `UPDATE print_media_articles SET validated = true WHERE id = $1 RETURNING *`,
        [parseInt(id)]
      );

      if (!result) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }

      return NextResponse.json(result);
    }

    // Fallback to memory
    const uploadArticles = (global as any).uploadArticles || [];
    const article = uploadArticles.find((a: any) => a.id === parseInt(id));

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    article.validated = true;
    return NextResponse.json({ ...article, validated: true });
  } catch (error) {
    console.error("Error validating article:", error);
    return NextResponse.json(
      { error: "Failed to validate article" },
      { status: 500 }
    );
  }
}
