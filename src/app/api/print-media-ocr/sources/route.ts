import { NextRequest, NextResponse } from "next/server";
import { query, initDatabase } from "@/lib/db";
import { analyzeSentiment } from "@/utils/sentiment";
import { explainArticle } from "@/utils/sumopod";

// Track if database has been initialized
let dbInitialized = false;

// Mock sources for demo when DB is not available
const mockSources: any[] = [
  {
    id: 1,
    newspaper_name: "Kompas",
    publication_date: "2024-01-15",
    file_path: "/uploads/kompas-15012024.pdf",
    original_filename: "Kompas 15 Januari 2024.pdf",
    file_size: 5242880,
    file_type: "application/pdf",
    ocr_status: "completed",
    ocr_started_at: "2024-01-15T08:00:00Z",
    ocr_completed_at: "2024-01-15T08:02:30Z",
    ocr_error_message: null,
    page_count: 12,
    article_count: 5,
    uploaded_at: "2024-01-15T07:55:00Z",
    processing_duration: 150000,
  },
];

// GET /api/print-media-ocr/sources - List all sources
export async function GET(request: NextRequest) {
  try {
    // Initialize database on first request
    if (process.env.POSTGRES_URL && !dbInitialized) {
      try {
        await initDatabase();
        dbInitialized = true;
      } catch (e) {
        console.error("DB init error:", e);
      }
    }

    // Try database first
    if (process.env.POSTGRES_URL) {
      const sources = await query(`
        SELECT 
          id, newspaper_name, publication_date, file_path, original_filename,
          file_size, file_type, ocr_status, ocr_started_at, ocr_completed_at,
          ocr_error_message, page_count, article_count, uploaded_at, processing_duration
        FROM print_media_sources
        ORDER BY uploaded_at DESC
        LIMIT 100
      `);

      return NextResponse.json({
        count: sources.length,
        next: null,
        previous: null,
        page_size: 25,
        current_page: 1,
        total_pages: 1,
        page_size_options: [10, 25, 50, 100],
        results: sources,
      });
    }

    // Fallback to mock data
    const uploadSources = (global as any).uploadSources || [];
    const allSources = [...mockSources, ...uploadSources].sort((a, b) =>
      new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );

    return NextResponse.json({
      count: allSources.length,
      next: null,
      previous: null,
      page_size: 25,
      current_page: 1,
      total_pages: 1,
      page_size_options: [10, 25, 50, 100],
      results: allSources,
    });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

// POST /api/print-media-ocr/sources - Create new source
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const newspaperName = formData.get("newspaper_name") as string;
    const publicationDate = formData.get("publication_date") as string;
    const autoProcess = formData.get("auto_process") === "true";

    if (!file || !newspaperName || !publicationDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newSource = {
      id: Date.now(),
      newspaper_name: newspaperName,
      publication_date: publicationDate,
      file_path: `/uploads/${file.name}`,
      original_filename: file.name,
      file_size: file.size,
      file_type: file.type,
      ocr_status: autoProcess ? "processing" : "pending",
      ocr_started_at: autoProcess ? new Date().toISOString() : null,
      ocr_completed_at: null,
      ocr_error_message: null,
      page_count: 1,
      article_count: 0,
      uploaded_at: new Date().toISOString(),
      processing_duration: null,
    };

    // Save to database if available
    if (process.env.POSTGRES_URL) {
      const result = await query(
        `INSERT INTO print_media_sources 
          (newspaper_name, publication_date, file_path, original_filename, file_size, file_type, 
           ocr_status, ocr_started_at, page_count, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          newspaperName,
          publicationDate,
          newSource.file_path,
          newSource.original_filename,
          newSource.file_size,
          newSource.file_type,
          newSource.ocr_status,
          newSource.ocr_started_at,
          newSource.page_count,
          newSource.uploaded_at,
        ]
      );

      if (autoProcess) {
        // Simulate background processing
        processOCRMock(result[0].id, newspaperName, publicationDate);
      }

      return NextResponse.json(result[0], { status: 201 });
    }

    // Fallback to memory
    if (!(global as any).uploadSources) {
      (global as any).uploadSources = [];
    }
    (global as any).uploadSources.unshift(newSource);

    if (autoProcess) {
      processOCRMock(newSource.id, newspaperName, publicationDate);
    }

    return NextResponse.json(newSource, { status: 201 });
  } catch (error) {
    console.error("Error creating source:", error);
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}

// Mock OCR processing with sentiment analysis
async function processOCRMock(sourceId: number, newspaperName: string, publicationDate: string) {
  const mockTitles = [
    "Ekonomi Indonesia Tumbuh Positif di Tengah Ketidakpastian Global",
    "Polusi Udara Jakarta Capai Tingkat Bahaya",
    "Startup Teknologi Indonesia Raih Pendanaan Baru",
    "Gempa Bumi Guncang Sulawesi, Ratusan Rumah Rusak",
    "Festival Budaya Nusantara Digelar di Jakarta",
    "Kenaikan Harga BBM影响 Masyarakat",
    "Timnas Indonesia Lolos ke Putaran Final",
    "Pemindahan Ibu Kota Nusantara Terus Dige Marjakan",
    "Inovasi Startup Lokal Sukses Tarik Minat Investor",
    "Digitalisasi UMKM Jadi Kunci Pertumbuhan Ekonomi",
  ];
  const mockCategories = ["Ekonomi", "Sosial", "Teknologi", "Budaya", "Lingkungan", "Politik"];
  const mockAuthors = ["Ahmad Fauzi", "Siti Nurhaliza", "Budi Santoso", "Dewi Lestari", null];

  const articleCount = 5 + Math.floor(Math.random() * 5);
  const processingStart = new Date().toISOString();

  // Analyze sentiments
  for (let i = 0; i < articleCount; i++) {
    const title = mockTitles[i % mockTitles.length];
    const content = `Artikel ini membahas tentang ${title.toLowerCase()}`;
    const result = analyzeSentiment(content);
    const avatarResponse = await explainArticle(title, content, result.sentiment, result.confidence, newspaperName);

    // Save article to database
    if (process.env.POSTGRES_URL) {
      await query(
        `INSERT INTO print_media_articles 
          (title, author, category, page_number, publication_date, newspaper_name,
           sentiment_analysis, confidence_score, validated, created_at, content, source_id,
           avatar_explanation, avatar_model)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          title, mockAuthors[i % mockAuthors.length], mockCategories[i % mockCategories.length],
          (i % 12) + 1, publicationDate, newspaperName, result.sentiment,
          result.confidence, Math.random() > 0.3, new Date().toISOString(), content,
          sourceId, avatarResponse.explanation, avatarResponse.model,
        ]
      );
    }

    // Small delay to simulate processing
    await new Promise((r) => setTimeout(r, 200));
  }

  // Update source as completed
  const processingEnd = new Date().toISOString();
  const processingDuration = new Date(processingEnd).getTime() - new Date(processingStart).getTime();

  if (process.env.POSTGRES_URL) {
    await query(
      `UPDATE print_media_sources 
       SET ocr_status = 'completed', ocr_completed_at = $1, 
           article_count = $2, processing_duration = $3
       WHERE id = $4`,
      [processingEnd, articleCount, processingDuration, sourceId]
    );
  }
}
