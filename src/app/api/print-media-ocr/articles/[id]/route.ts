import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

// Mock articles for demo
const mockArticles: any[] = [
  {
    id: 1,
    title: "Ekonomi Indonesia Tumbuh Positif di Tengah Ketidakpastian Global",
    author: "Ahmad Fauzi",
    category: "Ekonomi",
    page_number: 1,
    publication_date: "2024-01-15",
    newspaper_name: "Kompas",
    confidence_score: 0.87,
    sentiment_analysis: "positive",
    validated: true,
    created_at: "2024-01-15T08:00:00Z",
    content: "Ekonomi Indonesia menunjukkan pertumbuhan yang positif meskipun kondisi ekonomi dunia sedang tidak menentu.",
    source_id: 1,
    avatar_explanation: "Ekonomi Indonesia mengalami pertumbuhan yang positif meskipun kondisi ekonomi dunia sedang tidak menentu.",
    avatar_model: "MiniMax-M2.7-highspeed",
  },
];

// GET /api/print-media-ocr/articles/[id] - Get single article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try database first
    if (process.env.POSTGRES_URL) {
      const article = await queryOne(
        `SELECT id, title, author, category, page_number, publication_date,
                newspaper_name, confidence_score, sentiment_analysis, validated,
                created_at, content, source_id, avatar_explanation, avatar_model
         FROM print_media_articles
         WHERE id = $1`,
        [parseInt(id)]
      );

      if (!article) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }

      return NextResponse.json(article);
    }

    // Fallback to mock data
    const uploadArticles = (global as any).uploadArticles || [];
    const allArticles = [...mockArticles, ...uploadArticles];
    const article = allArticles.find((a: any) => a.id === parseInt(id));

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// DELETE /api/print-media-ocr/articles/[id] - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (process.env.POSTGRES_URL) {
      const result = await query(
        `DELETE FROM print_media_articles WHERE id = $1 RETURNING id`,
        [parseInt(id)]
      );

      if (result.length === 0) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    // Fallback to memory
    const uploadArticles = (global as any).uploadArticles || [];
    const index = uploadArticles.findIndex((a: any) => a.id === parseInt(id));

    if (index === -1) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    uploadArticles.splice(index, 1);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
