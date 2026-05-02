"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, XCircle, Users, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import SourceBreakdown from "./source-breakdown";

type EntityResult = {
  content_id: number;
  entity_name: string;
  entity_type: string;
  source?: string;
  sentiment_label?: string;
  sentiment_score?: number;
  mention_count?: number;
  context_sentences?: string[];
  created_at?: string;
};

type AllEntityResultsResponse = {
  results: EntityResult[];
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
};

export default function AllEntityResults() {
  const [data, setData] = useState<AllEntityResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("page_size", pageSize.toString());

      const response = await fetch(`/api/entity-sentiment/results?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.detail || "Failed to fetch results");
      }

      // Normalize shape: ensure results array and pagination fields exist
      const normalized: AllEntityResultsResponse = {
        results: Array.isArray(responseData.results) ? responseData.results : Array.isArray(responseData) ? responseData : responseData.results || [],
        total: responseData.total ?? responseData.count ?? undefined,
        page: responseData.page ?? responseData.current_page ?? currentPage,
        page_size: responseData.page_size ?? responseData.limit ?? pageSize,
        total_pages: responseData.total_pages ?? responseData.total_pages ?? undefined,
      };

      setData(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch results");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [currentPage, pageSize]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "text-green-600 dark:text-green-400";
      case "negative":
        return "text-red-600 dark:text-red-400";
      case "neutral":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getSentimentBgColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900";
      case "negative":
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900";
      case "neutral":
        return "bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-900";
      default:
        return "bg-card border-border";
    }
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Memuat results...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Tidak ada results ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Menampilkan <span className="font-medium text-foreground">{(currentPage - 1) * pageSize + 1}</span> -{' '}
          <span className="font-medium text-foreground">{Math.min(currentPage * pageSize, data.total ?? data.results.length)}</span>{' '}
          dari <span className="font-medium text-foreground">{data.total ?? data.results.length}</span> results
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Page Size:</label>
          <select
            aria-label="Page size"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {data.results.map((result, index) => (
          <div key={`${result.content_id}-${result.entity_name}-${index}`} className={`rounded-lg border p-4 ${getSentimentBgColor(result.sentiment_label)}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold capitalize">{result.entity_name}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{result.entity_type}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">Content ID: {result.content_id}</span>
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(result.created_at || new Date().toISOString())}</div>
              </div>
              <span className={`text-xs font-semibold capitalize px-2 py-1 rounded ${getSentimentColor(result.sentiment_label)}`}>
                {result.sentiment_label || "-"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-muted-foreground">Score: </span>
                <span className="font-medium">{typeof result.sentiment_score === 'number' ? `${(result.sentiment_score * 100).toFixed(2)}%` : '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mention Count: </span>
                <span className="font-medium">{result.mention_count ?? 0}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <SourceBreakdown entityName={result.entity_name} />
            </div>

            {result.context_sentences && result.context_sentences.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Context Sentences:</p>
                <ul className="space-y-1">
                  {result.context_sentences.slice(0, 3).map((sentence, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground">• {sentence}</li>
                  ))}
                  {result.context_sentences.length > 3 && (
                    <li className="text-xs text-muted-foreground italic">... dan {result.context_sentences.length - 3} lainnya</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {(data.total && data.total_pages && data.total_pages > 1) && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">Halaman {data.page} dari {data.total_pages}</div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1 || loading}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, data.total_pages) }, (_, i) => {
                let pageNum: number;
                if ((data.total_pages ?? 0) <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= (data.total_pages ?? 0) - 2) {
                  pageNum = (data.total_pages ?? 0) - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)} disabled={loading} className="min-w-[2.5rem]">
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.min(data.total_pages ?? 1, prev + 1))} disabled={currentPage === (data.total_pages ?? 1) || loading}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
