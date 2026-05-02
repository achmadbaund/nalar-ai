import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Mock articles for demo when DB is not available
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
    avatar_explanation: "Ekonomi Indonesia mengalami pertumbuhan yang positif meskipun kondisi ekonomi dunia sedang tidak menentu. Media Kompas memberitakan bahwa pertumbuhan ekonomi ini menunjukkan ketahanan ekonomi Indonesia di tengah ketidakpastian global.",
    avatar_model: "MiniMax-M2.7-highspeed",
  },
  {
    id: 2,
    title: "Polusi Udara Jakarta Capai Tingkat Bahaya",
    author: "Siti Nurhaliza",
    category: "Lingkungan",
    page_number: 3,
    publication_date: "2024-01-14",
    newspaper_name: "Kompas",
    confidence_score: 0.92,
    sentiment_analysis: "negative",
    validated: true,
    created_at: "2024-01-14T09:30:00Z",
    content: "Kualitas udara di Jakarta mencapai tingkat yang berbahaya bagi kesehatan.",
    source_id: 2,
    avatar_explanation: "Artikel ini menyoroti kondisi serius polusi udara di Jakarta yang mencapai tingkat berbahaya. Berita ini menggambarkan krisis lingkungan yang memerlukan perhatian dan tindakan segera.",
    avatar_model: "MiniMax-M2.7-highspeed",
  },
];

// GET /api/print-media-ocr/articles - List all articles
export async function GET(request: NextRequest) {
  try {
    // Try database first
    if (process.env.POSTGRES_URL) {
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get("page") || "1");
      const pageSize = parseInt(searchParams.get("page_size") || "25");
      const ordering = searchParams.get("ordering") || "-created_at";
      const sentiment = searchParams.get("sentiment");
      const search = searchParams.get("search");
      const validated = searchParams.get("validated");

      const offset = (page - 1) * pageSize;
      const orderDir = ordering.startsWith("-") ? "DESC" : "ASC";
      const orderField = ordering.replace("-", "");

      let whereClause = "WHERE 1=1";
      const params: any[] = [];
      let paramIndex = 1;

      if (sentiment) {
        whereClause += ` AND sentiment_analysis = $${paramIndex}`;
        params.push(sentiment);
        paramIndex++;
      }

      if (search) {
        whereClause += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (validated !== null && validated !== undefined) {
        whereClause += ` AND validated = $${paramIndex}`;
        params.push(validated === "true");
        paramIndex++;
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM print_media_articles ${whereClause}`,
        params
      );
      const totalCount = parseInt(countResult[0]?.count || "0");

      // Get articles
      const articles = await query(
        `SELECT id, title, author, category, page_number, publication_date,
                newspaper_name, confidence_score, sentiment_analysis, validated,
                created_at, content, source_id, avatar_explanation, avatar_model
         FROM print_media_articles
         ${whereClause}
         ORDER BY ${orderField} ${orderDir}
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, pageSize, offset]
      );

      return NextResponse.json({
        count: totalCount,
        next: page * pageSize < totalCount ? page + 1 : null,
        previous: page > 1 ? page - 1 : null,
        page_size: pageSize,
        current_page: page,
        total_pages: Math.ceil(totalCount / pageSize),
        page_size_options: [10, 25, 50, 100],
        results: articles,
      });
    }

    // Fallback to mock + memory data
    const uploadArticles = (global as any).uploadArticles || [];
    const allArticles = [...mockArticles, ...uploadArticles].sort((a, b) =>
      new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime()
    );

    return NextResponse.json({
      count: allArticles.length,
      next: null,
      previous: null,
      page_size: 25,
      current_page: 1,
      total_pages: 1,
      page_size_options: [10, 25, 50, 100],
      results: allArticles,
    });
  } catch (error) {
    console.error("Error fetching articles:", error);

    // Fallback to mock data on error
    return NextResponse.json({
      count: mockArticles.length,
      next: null,
      previous: null,
      page_size: 25,
      current_page: 1,
      total_pages: 1,
      page_size_options: [10, 25, 50, 100],
      results: mockArticles,
    });
  }
}

// POST /api/print-media-ocr/articles - Create new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (process.env.POSTGRES_URL) {
      const result = await query(
        `INSERT INTO print_media_articles 
          (title, author, category, page_number, publication_date, newspaper_name,
           confidence_score, sentiment_analysis, validated, content, source_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          body.title,
          body.author,
          body.category,
          body.page_number,
          body.publication_date,
          body.newspaper_name,
          body.confidence_score || 0.5,
          body.sentiment_analysis,
          body.validated || false,
          body.content,
          body.source_id,
        ]
      );

      return NextResponse.json(result[0], { status: 201 });
    }

    // Fallback to memory
    const newArticle = {
      id: Date.now(),
      ...body,
      created_at: new Date().toISOString(),
    };

    if (!(global as any).uploadArticles) {
      (global as any).uploadArticles = [];
    }
    (global as any).uploadArticles.unshift(newArticle);

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
