"use client";

import { useEffect, useState } from "react";
import { Loader2, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AllEmotionResultsResponse } from "./types";

export default function AllEmotionResults() {
  const [data, setData] = useState<AllEmotionResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(50);
  const [dominantEmotion, setDominantEmotion] = useState("");

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("skip", skip.toString());
      params.set("limit", limit.toString());
      if (dominantEmotion) {
        params.set("dominant_emotion", dominantEmotion);
      }

      const response = await fetch(`/api/emotion-detection/results?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.detail || "Failed to fetch results");
      }

      setData(responseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch results");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [skip, limit, dominantEmotion]);

  const formatDate = (dateString: string) => {
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

  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case "joy":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900";
      case "anger":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900";
      case "sadness":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900";
      case "fear":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-900";
      case "surprise":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900";
      default:
        return "text-muted-foreground bg-card border-border";
    }
  };

  const emotions = [
    { name: "anger", label: "Anger" },
    { name: "joy", label: "Joy" },
    { name: "sadness", label: "Sadness" },
    { name: "fear", label: "Fear" },
    { name: "surprise", label: "Surprise" },
  ];

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const currentPage = Math.floor(skip / limit) + 1;

  const handlePageChange = (newPage: number) => {
    setSkip((newPage - 1) * limit);
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
      {/* Filters & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Filter Emotion:</label>
          <select
            value={dominantEmotion}
            onChange={(e) => {
              setDominantEmotion(e.target.value);
              setSkip(0);
            }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">All Emotions</option>
            {emotions.map((emotion) => (
              <option key={emotion.name} value={emotion.name}>
                {emotion.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Limit:</label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setSkip(0);
            }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Menampilkan <span className="font-medium text-foreground">{skip + 1}</span> -{" "}
        <span className="font-medium text-foreground">
          {Math.min(skip + limit, data.total)}
        </span>{" "}
        dari <span className="font-medium text-foreground">{data.total}</span> results
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {data.results.map((result, index) => (
          <div
            key={`${result.content_id}-${result.id}-${index}`}
            className={`rounded-lg border p-4 ${getEmotionColor(result.dominant_emotion)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">Content ID: {result.content_id}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(result.created_at)}
                </div>
              </div>
              <span className="text-xs font-semibold capitalize px-2 py-1 rounded bg-primary text-primary-foreground">
                {result.dominant_emotion}
              </span>
            </div>

            <div className="space-y-2">
              {emotions.map((emotion) => {
                const score = result[`${emotion.name}_score` as keyof typeof result] as number;
                const isDominant = result.dominant_emotion === emotion.name;
                return (
                  <div key={emotion.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{emotion.label}</span>
                      {isDominant && (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">
                          Dominant
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                      <span className="font-medium w-12 text-right">
                        {(score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 mt-2 border-t border-border text-xs text-muted-foreground">
              ID: {result.id}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                    className="min-w-[2.5rem]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

