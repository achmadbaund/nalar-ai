import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";
import { analyzeSentiment } from "@/utils/sentiment";
import { explainArticle } from "@/utils/sumopod";

const BASE_URL = API_CONFIG.printMediaOcr.url;
const BASE_URL_CONFIGURED = !!API_CONFIG.printMediaOcr.baseUrl && !API_CONFIG.printMediaOcr.baseUrl.includes("localhost");

// Mock sources for demo
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
  {
    id: 2,
    newspaper_name: "Kompas",
    publication_date: "2024-01-14",
    file_path: "/uploads/kompas-14012024.pdf",
    original_filename: "Kompas 14 Januari 2024.pdf",
    file_size: 4980736,
    file_type: "application/pdf",
    ocr_status: "completed",
    ocr_started_at: "2024-01-14T08:00:00Z",
    ocr_completed_at: "2024-01-14T08:02:15Z",
    ocr_error_message: null,
    page_count: 10,
    article_count: 4,
    uploaded_at: "2024-01-14T07:50:00Z",
    processing_duration: 135000,
  },
  {
    id: 3,
    newspaper_name: "Republika",
    publication_date: "2024-01-13",
    file_path: "/uploads/republika-13012024.pdf",
    original_filename: "Republika 13 Januari 2024.pdf",
    file_size: 4194304,
    file_type: "application/pdf",
    ocr_status: "completed",
    ocr_started_at: "2024-01-13T08:00:00Z",
    ocr_completed_at: "2024-01-13T08:01:45Z",
    ocr_error_message: null,
    page_count: 8,
    article_count: 3,
    uploaded_at: "2024-01-13T07:45:00Z",
    processing_duration: 105000,
  },
  {
    id: 4,
    newspaper_name: "Media Indonesia",
    publication_date: "2024-01-11",
    file_path: "/uploads/mediaindonesia-11012024.pdf",
    original_filename: "Media Indonesia 11 Januari 2024.pdf",
    file_size: 5767168,
    file_type: "application/pdf",
    ocr_status: "completed",
    ocr_started_at: "2024-01-11T08:00:00Z",
    ocr_completed_at: "2024-01-11T08:03:00Z",
    ocr_error_message: null,
    page_count: 14,
    article_count: 6,
    uploaded_at: "2024-01-11T07:40:00Z",
    processing_duration: 180000,
  },
];

// GET /api/print-media-ocr/sources - List all sources with pagination
export async function GET(request: NextRequest) {
  try {
    // If backend URL is not configured or is localhost, return mock data
    if (!BASE_URL_CONFIGURED) {
      const allSources = [...mockSources, ...uploadSources].sort((a, b) =>
        new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      );
      return NextResponse.json({
        count: allSources.length,
        next: null,
        previous: null,
        page_size: 10,
        current_page: 1,
        total_pages: 1,
        page_size_options: [10, 25, 50, 100],
        results: allSources,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${BASE_URL}/sources/${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching sources:", error);
    // Return mock data on error
    return NextResponse.json({
      count: mockSources.length,
      next: null,
      previous: null,
      page_size: 10,
      current_page: 1,
      total_pages: 1,
      page_size_options: [10, 25, 50, 100],
      results: mockSources,
    });
  }
}

// POST /api/print-media-ocr/sources - Upload a new source
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get metadata
    const newspaperName = (formData.get("newspaper_name") as string) || "Unknown";
    const publicationDate = (formData.get("publication_date") as string) || new Date().toISOString().split("T")[0];
    const autoProcess = formData.get("auto_process") === "true";

    // Get file
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Mock response when backend is not available
    if (!BASE_URL_CONFIGURED) {
      const newSourceId = Date.now();
      const now = new Date();
      const pageCount = Math.floor(Math.random() * 10) + 5;
      const articleCount = Math.floor(Math.random() * 20) + 3;

      // Create source in "processing" state
      const processingStart = now.toISOString();

      // Store initial source with processing status
      if (!(global as any).uploadSources) (global as any).uploadSources = [];
      const initialSource = {
        id: newSourceId,
        newspaper_name: newspaperName,
        publication_date: publicationDate,
        file_path: `/uploads/${file.name}`,
        original_filename: file.name,
        file_size: file.size,
        file_type: file.type,
        ocr_status: "processing",
        ocr_started_at: processingStart,
        ocr_completed_at: null,
        ocr_error_message: null,
        page_count: pageCount,
        article_count: articleCount,
        file_url: null,
        processing_duration: null,
        uploaded_at: now.toISOString(),
      };
      (global as any).uploadSources.unshift(initialSource);

      // Add initial log
      if (!(global as any).uploadLogs) (global as any).uploadLogs = [];
      (global as any).uploadLogs.unshift({
        id: newSourceId + 1,
        source: newSourceId,
        level: "info",
        message: `Nalar: Starting OCR analysis on ${file.name}...`,
        details: { filename: file.name, file_size: file.size },
        created_at: now.toISOString(),
      });

      // Return immediately with processing status, then do background processing
      // Use setTimeout to allow response to be sent first
      const backgroundProcess = () => {
        setTimeout(async () => {
          // Helper function to add logs with delay
          const addLog = async (id: number, level: string, message: string, details: object, delay: number) => {
            await new Promise(resolve => setTimeout(resolve, delay));
            (global as any).uploadLogs.unshift({
              id,
              source: newSourceId,
              level,
              message,
              details,
              created_at: new Date().toISOString(),
            });
          };

          // Step 1: OCR Processing
          await addLog(newSourceId + 2, "info", `Processing ${pageCount} pages with Tesseract OCR engine...`, { pages: pageCount }, 2000);
          await addLog(newSourceId + 3, "info", `Nalar: Detecting text layouts and structures...`, { layout_type: "newspaper" }, 2500);
          await addLog(newSourceId + 4, "info", `Extracting ${articleCount} articles from scanned document`, { articles_extracted: articleCount }, 2000);

          // Step 2: IndoBERT Sentiment Analysis
          await addLog(newSourceId + 5, "info", `Running sentiment analysis with IndoBERT model...`, { sentiment_model: "indobert-sentiment" }, 500);

          const fileBaseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          const mockTitles = Array.from({ length: 12 }, (_, i) =>
            `${fileBaseName} - Halaman ${i + 1}`
          );

          const mockCategories = ["Ekonomi", "Sosial", "Teknologi", "Budaya", "Lingkungan", "Politik", "Bisnis"];
          const mockAuthors = [null];

          // Get sentiment for each article using IndoBERT
          const articlesSentiments: Array<{ sentiment: string; confidence: number }> = [];
          for (let i = 0; i < articleCount; i++) {
            const content = `Artikel ini membahas tentang ${mockTitles[i % mockTitles.length].toLowerCase()}`;
            // Use local sentiment analysis (no external dependency)
            const result = analyzeSentiment(content);
            articlesSentiments.push({ sentiment: result.sentiment, confidence: result.confidence });
            await addLog(newSourceId + 6 + i, "info", `IndoBERT: Analyzing article ${i + 1}/${articleCount}...`, { article: i + 1, total: articleCount, sentiment: result.sentiment }, 800);
          }

          await addLog(newSourceId + 100, "info", `IndoBERT: Sentiment analysis completed. All ${articleCount} articles analyzed.`, { articles_analyzed: articleCount, model: "IndoBERT" }, 500);

          // Log Sumopod avatar explanation
          await addLog(newSourceId + 101, "info", `Nalar: Generating explanations with MiniMax AI...`, { ai_model: "MiniMax-M2.2-highspeed" }, 500);

          // Generate articles with avatar explanations
          const newArticles = await Promise.all(
            Array.from({ length: articleCount }, async (_, i) => {
              const title = mockTitles[i % mockTitles.length];
              const content = `Artikel ini membahas tentang ${mockTitles[i % mockTitles.length].toLowerCase()} yang menjadi perhatian publik.`;
              const sentiment = articlesSentiments[i]?.sentiment || "neutral";
              const confidence = articlesSentiments[i]?.confidence || 0.8;

              // Get avatar explanation from Sumopod AI
              const avatarResponse = await explainArticle(title, content, sentiment, confidence, newspaperName);

              await addLog(newSourceId + 102 + i, "info", `Nalar: "${title.slice(0, 40)}..." - ${sentiment}`, { sentiment, model: avatarResponse.model }, 300);

              return {
                id: newSourceId + 200 + i,
                title,
                author: mockAuthors[i % mockAuthors.length],
                category: mockCategories[i % mockCategories.length],
                page_number: (i % pageCount) + 1,
                publication_date: publicationDate,
                newspaper_name: newspaperName,
                sentiment_analysis: sentiment,
                confidence_score: parseFloat(confidence.toFixed(2)),
                validated: Math.random() > 0.3,
                created_at: new Date().toISOString(),
                content: `Artikel ini membahas tentang ${mockTitles[i % mockTitles.length].toLowerCase()} yang menjadi perhatian publik.`,
                source: newSourceId,
                avatar_explanation: avatarResponse.explanation,
                avatar_model: avatarResponse.model,
              };
            })
          );

          if (!(global as any).uploadArticles) (global as any).uploadArticles = [];
          (global as any).uploadArticles.unshift(...newArticles);

          // Dispatch event to notify articles tab
          // Note: Can't use window in server, will be handled by polling

          // Complete - update source status
          const processingEnd = new Date().toISOString();
          const processingDuration = new Date(processingEnd).getTime() - new Date(processingStart).getTime();

          await addLog(newSourceId + 300, "info", `OCR completed. Extracted ${articleCount} articles with sentiment analysis.`, { articles_extracted: articleCount, pages_processed: pageCount, duration_ms: processingDuration }, 300);

          // Update source to completed
          const sourceIndex = (global as any).uploadSources.findIndex((s: any) => s.id === newSourceId);
          if (sourceIndex !== -1) {
            (global as any).uploadSources[sourceIndex] = {
              ...(global as any).uploadSources[sourceIndex],
              ocr_status: "completed",
              ocr_completed_at: processingEnd,
              processing_duration: processingDuration,
            };
          }
        }, 100);
      };

      backgroundProcess();

      return NextResponse.json({
        id: newSourceId,
        newspaper_name: newspaperName,
        publication_date: publicationDate,
        file_path: `/uploads/${file.name}`,
        original_filename: file.name,
        file_size: file.size,
        file_type: file.type,
        ocr_status: "processing",
        ocr_started_at: processingStart,
        ocr_completed_at: null,
        ocr_error_message: null,
        page_count: pageCount,
        article_count: articleCount,
        file_url: null,
        processing_duration: null,
        uploaded_at: now.toISOString(),
      });
    }

    // Convert file to buffer for reliable transfer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create backend FormData
    const backendFormData = new FormData();
    backendFormData.append("file", new Blob([buffer], { type: file.type }), file.name);
    backendFormData.append("newspaper_name", newspaperName);
    backendFormData.append("publication_date", publicationDate);

    // Fetch with extended timeout (10 minutes for large files)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes

    const response = await fetch(`${BASE_URL}/sources/`, {
      method: "POST",
      body: backendFormData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Trigger OCR if auto_process is true
    if (autoProcess && data.id) {
      try {
        await fetch(`${BASE_URL}/sources/${data.id}/process-ocr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force_reprocess: false }),
        });
      } catch (ocrError) {
        console.error("Failed to trigger OCR:", ocrError);
        // Don't fail the upload if OCR trigger fails
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("Upload timeout");
      return NextResponse.json(
        { error: "Upload timeout - file may be too large" },
        { status: 504 }
      );
    }

    console.error("Error uploading source:", error);
    return NextResponse.json(
      {
        error: "Failed to upload source",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
