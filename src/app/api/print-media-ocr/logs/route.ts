import { NextRequest, NextResponse } from "next/server";
import { API_CONFIG } from "@/config/api";

const BASE_URL = API_CONFIG.printMediaOcr.url;

// Mock data for demo (empty - only show uploaded data)
const mockLogs: any[] = [];

// GET /api/print-media-ocr/logs - List all processing logs with pagination
export async function GET(request: NextRequest) {
  try {
    // If backend URL is not configured or is localhost, return mock data
    if (!BASE_URL || BASE_URL.includes("localhost") || BASE_URL.includes("undefined")) {
      // Combine static mock logs with any upload logs
      const uploadLogs = (global as any).uploadLogs || [];
      const allLogs = [...uploadLogs, ...mockLogs].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return NextResponse.json({
        count: allLogs.length,
        next: null,
        previous: null,
        page_size: 10,
        current_page: 1,
        total_pages: 1,
        page_size_options: [10, 25, 50, 100],
        results: allLogs,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const url = `${BASE_URL}/logs/${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
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

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching logs:", error);
    // Return mock data on error
    return NextResponse.json({
      count: mockLogs.length,
      next: null,
      previous: null,
      page_size: 10,
      current_page: 1,
      total_pages: 1,
      page_size_options: [10, 25, 50, 100],
      results: mockLogs,
    });
  }
}
