import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// Mock logs for demo
const mockLogs: any[] = [];

// GET /api/print-media-ocr/logs - List all processing logs
export async function GET(request: NextRequest) {
  try {
    if (process.env.POSTGRES_URL) {
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get("page") || "1");
      const pageSize = parseInt(searchParams.get("page_size") || "25");
      const sourceId = searchParams.get("source_id");

      const offset = (page - 1) * pageSize;

      let whereClause = "";
      const params: any[] = [];
      let paramIndex = 1;

      if (sourceId) {
        whereClause = `WHERE source_id = $${paramIndex}`;
        params.push(parseInt(sourceId));
        paramIndex++;
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM print_media_logs ${whereClause}`,
        params
      );
      const totalCount = parseInt(countResult[0]?.count || "0");

      // Get logs
      const logs = await query(
        `SELECT id, source_id, level, message, details, created_at
         FROM print_media_logs
         ${whereClause}
         ORDER BY created_at DESC
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
        results: logs,
      });
    }

    // Fallback to mock data
    const uploadLogs = (global as any).uploadLogs || [];
    const allLogs = [...uploadLogs, ...mockLogs].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      count: allLogs.length,
      next: null,
      previous: null,
      page_size: 25,
      current_page: 1,
      total_pages: 1,
      page_size_options: [10, 25, 50, 100],
      results: allLogs,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({
      count: mockLogs.length,
      next: null,
      previous: null,
      page_size: 25,
      current_page: 1,
      total_pages: 1,
      page_size_options: [10, 25, 50, 100],
      results: mockLogs,
    });
  }
}
