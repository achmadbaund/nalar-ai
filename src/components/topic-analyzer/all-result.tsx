"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, XCircle, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

type TopicResult = {
  content_id?: number;
  topic?: string;
  score?: number;
  mention_count?: number;
  context_sentences?: string[];
  created_at?: string;
  subtopics?: TopicResult[];
};

type AllTopicResultsResponse = {
  results: TopicResult[];
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
};

export default function TopicAllResults() {
  const [data, setData] = useState<AllTopicResultsResponse | null>(null);
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

      const res = await fetch(`/api/topic-analyzer/results?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error || payload.detail || "Failed to fetch topic results");
      }

      const normalized: AllTopicResultsResponse = {
        results: Array.isArray(payload.results) ? payload.results : Array.isArray(payload) ? payload : payload.results || payload.topics || [],
        total: payload.total ?? payload.count ?? undefined,
        page: payload.page ?? payload.current_page ?? currentPage,
        page_size: payload.page_size ?? payload.limit ?? pageSize,
        total_pages: payload.total_pages ?? undefined,
      };

      setData(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch topic results");
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

  if (loading && !data) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Memuat topic results...</span>
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
        <p className="text-sm text-muted-foreground">Tidak ada topic results ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Menampilkan <span className="font-medium text-foreground">{(currentPage - 1) * pageSize + 1}</span> -{' '}
          <span className="font-medium text-foreground">{Math.min(currentPage * pageSize, data.total ?? data.results.length)}</span>{' '}
          dari <span className="font-medium text-foreground">{data.total ?? data.results.length}</span> topics
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

      <div className="space-y-3">
        {data.results.map((t, idx) => (
          <div key={`${t.content_id ?? 'c'}-${t.topic ?? 'topic'}-${idx}`} className="rounded-lg border p-4 bg-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold capitalize">{t.topic ?? "-"}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">Content ID: {t.content_id ?? '-'}</span>
                </div>
                <div className="text-xs text-muted-foreground">{formatDate(t.created_at || "")}</div>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded text-muted-foreground">Score: {typeof t.score === 'number' ? `${(t.score * 100).toFixed(2)}%` : '-'}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-muted-foreground">Mention Count: </span>
                <span className="font-medium">{t.mention_count ?? 0}</span>
              </div>
            </div>

            {
              t.context_sentences && t.context_sentences.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Context Sentences:</p>
                  <ul className="space-y-1">
                    {t.context_sentences.slice(0, 3).map((s, sidx) => (
                      <li key={sidx} className="text-xs text-muted-foreground">• {s}</li>
                    ))}
                    {t.context_sentences.length > 3 && (
                      <li className="text-xs text-muted-foreground italic">... dan {t.context_sentences.length - 3} lainnya</li>
                    )}
                  </ul>
                </div>
              )
            }
          </div>
        ))}
      </div>

      {
        (data.total && data.total_pages && data.total_pages > 1) && (
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
        )
      }
    </div >
  );
}
