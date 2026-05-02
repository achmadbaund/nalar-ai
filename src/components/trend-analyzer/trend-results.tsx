"use client";

import { useState, useEffect, useMemo } from "react";
import { Database, Calendar, Loader2, Filter, X, XCircle, Lightbulb, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { toast } from "sonner";
import type { TrendResult, TrendResultsQuery, TrendAnalyzeResponse, TopicSamplePost, TopicSamplesResponse } from "./types";

type ViewMode = "single" | "timeseries";

export default function TrendResults() {
  const [data, setData] = useState<TrendResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View Mode
  const [viewMode, setViewMode] = useState<ViewMode>("single");

  // Filters
  const [filters, setFilters] = useState<TrendResultsQuery>({});
  const [showFilters, setShowFilters] = useState(false);

  // Detail Modal
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<TrendAnalyzeResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Insights Modal
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  // Topic Samples
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [topicSamples, setTopicSamples] = useState<Map<string, TopicSamplePost[]>>(new Map());
  const [loadingSamples, setLoadingSamples] = useState<Set<string>>(new Set());

  // Calculate insights from data
  const resultsInsights = useMemo(() => {
    if (data.length === 0) return null;

    const upward = data.filter(d => d.trend_type === "upward").length;
    const downward = data.filter(d => d.trend_type === "downward").length;
    const stable = data.filter(d => d.trend_type === "stable").length;
    const spikes = data.filter(d => d.has_spike).length;
    const anomalies = data.filter(d => d.has_anomaly).length;
    const avgScore = data.reduce((sum, d) => sum + d.avg_sentiment_score, 0) / data.length;
    const upwardPct = (upward / data.length) * 100;

    let interpretation = "";
    if (upwardPct > 60) interpretation = "Sentiment secara umum dalam tren positif. Brand perception sedang meningkat.";
    else if (upwardPct < 40) interpretation = "Sentiment secara umum dalam tren negatif. Perlu evaluasi penyebab penurunan.";
    else interpretation = "Sentiment stabil tanpa tren signifikan. Monitor terus untuk perubahan.";

    return {
      total: data.length,
      upward,
      downward,
      stable,
      spikes,
      anomalies,
      avgScore,
      upwardPct,
      downwardPct: (downward / data.length) * 100,
      stablePct: (stable / data.length) * 100,
      interpretation,
    };
  }, [data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.date) params.set("date", filters.date);
      if (filters.start_date) params.set("start_date", filters.start_date);
      if (filters.end_date) params.set("end_date", filters.end_date);
      if (filters.trend_type) params.set("trend_type", filters.trend_type);
      if (filters.has_spike !== undefined) params.set("has_spike", filters.has_spike.toString());

      const queryString = params.toString();
      const url = `/api/trend-analyzer/results${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch trend results");
      }

      const results: TrendResult[] = await response.json();
      setData(Array.isArray(results) ? results : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const clearFilters = () => {
    setFilters({});
    setShowFilters(false);
  };

  // Fetch detail data for a specific date
  const fetchDetail = async (date: string) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      setDetailData(null);

      const response = await fetch(
        `/api/trend-analyzer/analyze?start_date=${date}&end_date=${date}&include_breakdowns=true`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch trend details");
      }

      const result: TrendAnalyzeResponse = await response.json();

      // Open modal after successful data fetch
      setSelectedDate(date);
      setDetailData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch detail";

      // Check if error is "no data" error
      if (errorMessage.includes("Tidak ada data sentiment")) {
        // Show toast warning instead of modal
        toast.warning("Tidak Ada Data", {
          description: errorMessage,
          duration: 5000,
        });
        // Reset states
        setDetailLoading(false);
        setDetailError(null);
        setDetailData(null);
        return;
      }

      // For other errors, open modal and show error inside
      setSelectedDate(date);
      setDetailError(errorMessage);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedDate(null);
    setDetailData(null);
    setDetailError(null);
  };

  // Toggle and fetch topic samples
  const toggleTopicSamples = async (topic: string) => {
    const newExpanded = new Set(expandedTopics);

    if (newExpanded.has(topic)) {
      // Collapse
      newExpanded.delete(topic);
    } else {
      // Expand and fetch samples
      newExpanded.add(topic);

      if (!topicSamples.has(topic)) {
        setLoadingSamples(prev => new Set(prev).add(topic));

        try {
          const response = await fetch(
            `/api/trend-analyzer/posts/by-topic?` +
            `start_date=${selectedDate}&end_date=${selectedDate}&topic=${encodeURIComponent(topic)}&limit=3`
          );

          if (response.ok) {
            const data: TopicSamplesResponse = await response.json();
            setTopicSamples(prev => new Map(prev).set(topic, data.posts));
          }
        } catch (err) {
          console.error("Failed to fetch topic samples:", err);
        } finally {
          setLoadingSamples(prev => {
            const newSet = new Set(prev);
            newSet.delete(topic);
            return newSet;
          });
        }
      }
    }

    setExpandedTopics(newExpanded);
  };

  const getTrendBadge = (trendType: string) => {
    const styles = {
      upward: "bg-green-500/10 text-green-500 border-green-500/20",
      downward: "bg-red-500/10 text-red-500 border-red-500/20",
      stable: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    };
    const defaultStyle = "bg-gray-500/10 text-gray-500 border-gray-500/20";

    return (
      <span
        className={`rounded-full border px-3 py-1 text-xs font-medium ${
          styles[trendType.toLowerCase() as keyof typeof styles] || defaultStyle
        }`}
      >
        {trendType.charAt(0).toUpperCase() + trendType.slice(1)}
      </span>
    );
  };

  const getTrendIcon = (trendType: string) => {
    switch (trendType.toLowerCase()) {
      case "upward":
        return "📈";
      case "downward":
        return "📉";
      default:
        return "➡️";
    }
  };

  const getTrendColor = (trendType: string) => {
    switch (trendType.toLowerCase()) {
      case "upward":
        return "text-green-500";
      case "downward":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Detail Modal Component
  const DetailModal = () => {
    if (!selectedDate) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-6">
            <div>
              <h3 className="text-xl font-semibold">Detail: {selectedDate}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {detailData ? "Feature extraction breakdown" : "Loading..."}
              </p>
            </div>
            <button
              onClick={closeDetail}
              className="rounded-md p-2 hover:bg-muted"
              title="Close"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Loading */}
            {detailLoading && (
              <div className="flex min-h-[200px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error/Warning */}
            {detailError && !detailLoading && (
              detailError.includes("Tidak ada data sentiment") ? (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                  <p className="font-medium text-yellow-600 dark:text-yellow-400">⚠️ Peringatan</p>
                  <p className="mt-1 text-sm text-yellow-600/80 dark:text-yellow-400/80">{detailError}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="font-medium text-destructive">Error</p>
                  <p className="mt-1 text-sm text-destructive/80">{detailError}</p>
                </div>
              )
            )}

            {/* Empty Data Warning */}
            {!detailLoading && !detailData && !detailError && (
              <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                <p className="font-medium text-yellow-600 dark:text-yellow-400">
                  ⚠️ Tidak ada data breakdown
                </p>
                <p className="mt-1 text-sm text-yellow-600/80 dark:text-yellow-400/80">
                  Tanggal ini tidak memiliki data breakdown yang tersedia. Silakan pilih tanggal lain.
                </p>
              </div>
            )}

            {/* Detail Data */}
            {detailData && !detailLoading && (
              <div className="space-y-6">
                {/* Feature Extraction Indicator */}
                {detailData.breakdowns && (
                  <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
                    <h4 className="mb-3 font-semibold text-blue-700 dark:text-blue-300">
                      ✓ Feature Extraction Applied
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm phone:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Sentiment Analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Source Detection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Topic Categorization</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Temporal Analysis</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Analyzed {detailData.breakdowns.total_posts} posts across {detailData.breakdowns.by_source.length} platforms
                      {detailData.breakdowns.by_topic.length > 0 && ` and ${detailData.breakdowns.by_topic.length} topic categories`}
                    </p>
                  </div>
                )}

                {/* Breakdown by Source */}
                {detailData.breakdowns?.by_source && detailData.breakdowns.by_source.length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <span>📱</span>
                      Sentiment by Source Platform
                    </h4>
                    <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 laptop:grid-cols-3">
                      {detailData.breakdowns.by_source.map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-border bg-muted/20 p-4 overflow-hidden">
                          <div className="mb-2 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold truncate flex-1">{item.label}</p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">{item.count} posts</p>
                            </div>
                            <a
                              href={`/apify-crawler?tab=posts&platform=${encodeURIComponent(item.label.toLowerCase())}&posted_start_date=${selectedDate}&posted_end_date=${selectedDate}&analyzed=true`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline w-fit"
                            >
                              Lihat Posts →
                            </a>
                          </div>
                          <p className="mb-2 text-3xl font-bold">
                            {item.sentiment_score.toFixed(3)}
                          </p>
                          <div className="mb-1 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.percentage.toFixed(1)}% of total posts
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Breakdown by Topic */}
                {detailData.breakdowns?.by_topic && detailData.breakdowns.by_topic.length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <span>🏷️</span>
                      Sentiment by Topic Category
                      <div className="group relative">
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        <div className="absolute left-0 top-6 z-10 hidden w-80 rounded-lg border border-border bg-popover p-3 text-sm text-popover-foreground shadow-md group-hover:block">
                          <p className="font-medium">Tentang "Uncategorized"</p>
                          <p className="mt-1 text-muted-foreground">
                            Posts muncul sebagai "Uncategorized" karena sistem topic classification belum fully implemented.
                          </p>
                          <p className="mt-2 text-muted-foreground">
                            <strong>Data source:</strong> topic_results.primary_category (should be populated by AI Gateway topic service)
                          </p>
                          <p className="mt-2 text-muted-foreground">
                            <strong>Status:</strong> Topic categorization pipeline belum diimplementasikan.
                          </p>
                        </div>
                      </div>
                    </h4>
                    <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 laptop:grid-cols-3">
                      {detailData.breakdowns.by_topic.map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-border bg-muted/20 p-4 overflow-hidden">
                          <div className="mb-2 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold truncate flex-1">{item.label}</p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">{item.count} posts</p>
                            </div>
                            <button
                              onClick={() => toggleTopicSamples(item.label)}
                              className="text-xs text-primary hover:underline text-left w-fit"
                            >
                              {expandedTopics.has(item.label) ? "▼ Sembunyikan contoh" : "▼ Lihat contoh post"}
                            </button>
                          </div>
                          <p className="mb-2 text-3xl font-bold">
                            {item.sentiment_score.toFixed(3)}
                          </p>
                          <div className="mb-1 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.percentage.toFixed(1)}% of total posts
                          </p>

                          {/* Sample posts */}
                          {expandedTopics.has(item.label) && (
                            <div className="mt-3 space-y-2 border-t border-border pt-3">
                              {loadingSamples.has(item.label) ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Memuat contoh post...</span>
                                </div>
                              ) : (
                                topicSamples.get(item.label)?.map((post) => {
                                  // Determine color based on sentiment label
                                  const getSentimentColor = (label: string) => {
                                    const labelLower = label?.toLowerCase() || '';
                                    if (labelLower === 'positive') return 'text-green-600 dark:text-green-400 font-semibold';
                                    if (labelLower === 'negative') return 'text-red-600 dark:text-red-400 font-semibold';
                                    if (labelLower === 'neutral') return 'text-gray-600 dark:text-gray-400 font-semibold';
                                    return 'text-muted-foreground';
                                  };

                                  return (
                                    <div
                                      key={post.id}
                                      className="rounded-md border border-border bg-card p-3 text-sm overflow-hidden"
                                    >
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1">
                                        <span className="font-medium">{post.platform}</span>
                                        <span>•</span>
                                        <span className="whitespace-nowrap">{post.posted_at ? new Date(post.posted_at).toLocaleDateString('id-ID') : 'N/A'}</span>
                                        <span>•</span>
                                        <span className={getSentimentColor(post.sentiment_label)}>
                                          {post.sentiment_label}
                                        </span>
                                      </div>
                                      <p className="line-clamp-3 break-words">{post.content}</p>
                                      {post.url && (
                                        <a
                                          href={post.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="mt-1 text-xs text-primary hover:underline"
                                        >
                                          Lihat post asli →
                                        </a>
                                      )}
                                    </div>
                                  );
                                }) || (
                                  <p className="text-sm text-muted-foreground">
                                    Tidak ada contoh post untuk topik ini.
                                  </p>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Breakdown by Hour */}
                {detailData.breakdowns?.by_hour && detailData.breakdowns.by_hour.length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <span>🕐</span>
                      Sentiment by Hour of Day
                    </h4>
                    <div className="grid grid-cols-1 gap-3 phone:grid-cols-2 laptop:grid-cols-4">
                      {detailData.breakdowns.by_hour.map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-border bg-muted/20 p-3">
                          <div className="mb-1 flex items-center justify-between">
                            <p className="text-sm font-medium">{item.label}:00</p>
                            <p className="text-xs text-muted-foreground">{item.count} posts</p>
                          </div>
                          <p className="text-lg font-bold">
                            {item.sentiment_score.toFixed(3)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Breakdown by Day */}
                {detailData.breakdowns?.by_day && detailData.breakdowns.by_day.length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      <span>📅</span>
                      Sentiment by Day of Week
                    </h4>
                    <div className="grid grid-cols-1 gap-3 phone:grid-cols-2 laptop:grid-cols-4">
                      {detailData.breakdowns.by_day.map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-border bg-muted/20 p-3">
                          <div className="mb-1 flex items-center justify-between">
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.count} posts</p>
                          </div>
                          <p className="text-lg font-bold">
                            {item.sentiment_score.toFixed(3)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Trend Results</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm hover:bg-muted"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium">View Mode</label>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewMode("single");
              // Clear range filters when switching to single mode
              setFilters({ ...filters, start_date: undefined, end_date: undefined });
            }}
            className={`flex-1 rounded-md px-4 py-2 text-sm ${
              viewMode === "single" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Single Date
          </button>
          <button
            onClick={() => {
              setViewMode("timeseries");
              // Clear single date filter when switching to timeseries mode
              setFilters({ ...filters, date: undefined });
            }}
            className={`flex-1 rounded-md px-4 py-2 text-sm ${
              viewMode === "timeseries" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Time Series
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {viewMode === "single"
            ? "View results for a specific date or filter by criteria"
            : "View time series analysis for a date range with chart visualization"}
        </p>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-semibold">Filter Results</h4>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 laptop:grid-cols-3">
            {/* Date filters based on view mode */}
            {viewMode === "single" ? (
              <div>
                <label className="mb-2 text-sm font-medium">Specific Date</label>
                <input
                  type="date"
                  value={filters.date || ""}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value || undefined })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-2 text-sm font-medium">Start Date</label>
                  <input
                    type="date"
                    value={filters.start_date || ""}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value || undefined })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-2 text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    value={filters.end_date || ""}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value || undefined })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-2 text-sm font-medium">Trend Type</label>
              <select
                value={filters.trend_type || ""}
                onChange={(e) => setFilters({ ...filters, trend_type: e.target.value || undefined })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">All Types</option>
                <option value="upward">Upward</option>
                <option value="downward">Downward</option>
                <option value="stable">Stable</option>
              </select>
            </div>
            <div>
              <label className="mb-2 text-sm font-medium">Spike Detected</label>
              <select
                value={filters.has_spike === undefined ? "" : filters.has_spike.toString()}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    has_spike: e.target.value === "" ? undefined : e.target.value === "true",
                  })
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error</p>
          <p className="mt-1 text-sm text-destructive/80">{error}</p>
        </div>
      )}

      {/* No Data */}
      {!loading && !error && data.length === 0 && (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
          <div className="text-center">
            <Database className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No trend results found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        </div>
      )}

      {/* Results - Time Series Mode */}
      {!loading && !error && data.length > 0 && viewMode === "timeseries" && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Time Series Summary</h3>
            <div className="grid grid-cols-1 gap-4 phone:grid-cols-4">
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Total Days</p>
                <p className="mt-1 text-lg font-semibold">{data.length}</p>
              </div>
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Spikes Detected</p>
                <p className="mt-1 text-lg font-semibold text-orange-500">{data.filter((d) => d.has_spike).length}</p>
              </div>
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Anomalies Detected</p>
                <p className="mt-1 text-lg font-semibold text-red-500">{data.filter((d) => d.has_anomaly).length}</p>
              </div>
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Avg Sentiment</p>
                <p className="mt-1 text-lg font-semibold">
                  {(data.reduce((sum, d) => sum + d.avg_sentiment_score, 0) / data.length).toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Trend</th>
                    <th className="px-4 py-3 text-left font-medium">Sentiment</th>
                    <th className="px-4 py-3 text-left font-medium">MA-7D</th>
                    <th className="px-4 py-3 text-left font-medium">MA-30D</th>
                    <th className="px-4 py-3 text-left font-medium">Spike</th>
                    <th className="px-4 py-3 text-left font-medium">Anomaly</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => fetchDetail(row.date)}
                          className="rounded text-primary hover:underline hover:text-primary/80"
                          title="Click to view details"
                        >
                          {row.date}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={getTrendColor(row.trend_type)}>
                          {getTrendIcon(row.trend_type)} {row.trend_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{row.avg_sentiment_score.toFixed(4)}</td>
                      <td className="px-4 py-3">{row.moving_average_7d?.toFixed(4) || "-"}</td>
                      <td className="px-4 py-3">{row.moving_average_30d?.toFixed(4) || "-"}</td>
                      <td className="px-4 py-3">
                        {row.has_spike ? (
                          <span className="text-orange-500">
                            {row.spike_percentage?.toFixed(1)}% {row.spike_direction === "positive" ? "↑" : "↓"}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">{row.has_anomaly ? <span className="text-red-500">Yes</span> : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Results - Single Date Mode (Original Table) */}
      {!loading && !error && data.length > 0 && viewMode === "single" && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Trend Type</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Avg Score</th>
                <th className="px-4 py-3 text-right text-sm font-medium">7d MA</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Spike</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Spike %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => fetchDetail(item.date)}
                      className="rounded text-primary hover:underline hover:text-primary/80"
                      title="Click to view details"
                    >
                      {item.date}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">{getTrendBadge(item.trend_type)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    {item.avg_sentiment_score.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                    {item.moving_average_7d?.toFixed(4) || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    {item.has_spike ? (
                      <span className="rounded-full bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-500">
                        Yes
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {item.spike_percentage !== undefined && item.spike_percentage !== null ? (
                      <span
                        className={
                          item.spike_direction === "positive" ? "text-green-500" : "text-red-500"
                        }
                      >
                        {item.spike_percentage.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results Count & Insights Button */}
      {!loading && !error && data.length > 0 && (
        <>
          <div className="text-center text-sm text-muted-foreground">
            Showing {data.length} result{data.length !== 1 ? "s" : ""}
          </div>

          {/* Insights Button - Show in both modes */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowInsightsModal(true)}
              className="flex items-center gap-2 rounded-md border border-border bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/20"
            >
              <Lightbulb className="h-4 w-4" />
              {viewMode === "timeseries" ? "Lihat Ringkasan" : "Lihat Ringkasan"}
            </button>
          </div>
        </>
      )}

      {/* Detail Modal */}
      <DetailModal />

      {/* Insights Modal */}
      {showInsightsModal && resultsInsights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowInsightsModal(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card shadow-lg" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-6">
              <div>
                <h3 className="text-xl font-semibold">📊 Ringkasan Tren</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Analisis tren sentiment secara keseluruhan
                </p>
              </div>
              <button
                onClick={() => setShowInsightsModal(false)}
                className="rounded-md p-2 hover:bg-muted"
                title="Close"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Total Period */}
                <div className="rounded-lg bg-muted/20 p-4">
                  <p className="text-sm text-muted-foreground">Total Periode</p>
                  <p className="mt-1 text-2xl font-bold">{resultsInsights.total} hari</p>
                </div>

                {/* Trend Distribution */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/30">
                    <p className="text-xs text-muted-foreground">Tren Naik 📈</p>
                    <p className="mt-1 text-xl font-bold text-green-700 dark:text-green-300">
                      {resultsInsights.upward}
                    </p>
                    <p className="text-xs text-muted-foreground">{resultsInsights.upwardPct.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg bg-red-500/10 p-4 border border-red-500/30">
                    <p className="text-xs text-muted-foreground">Tren Turun 📉</p>
                    <p className="mt-1 text-xl font-bold text-red-700 dark:text-red-300">
                      {resultsInsights.downward}
                    </p>
                    <p className="text-xs text-muted-foreground">{resultsInsights.downwardPct.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg bg-gray-500/10 p-4 border border-gray-500/30">
                    <p className="text-xs text-muted-foreground">Stabil ➡️</p>
                    <p className="mt-1 text-xl font-bold text-gray-700 dark:text-gray-300">
                      {resultsInsights.stable}
                    </p>
                    <p className="text-xs text-muted-foreground">{resultsInsights.stablePct.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Events */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-orange-500/10 p-4 border border-orange-500/30">
                    <p className="text-sm text-orange-700 dark:text-orange-300">⚡ Spike Terdeteksi</p>
                    <p className="mt-1 text-xl font-bold">{resultsInsights.spikes} kali</p>
                  </div>
                  <div className="rounded-lg bg-purple-500/10 p-4 border border-purple-500/30">
                    <p className="text-sm text-purple-700 dark:text-purple-300">🔍 Anomaly Terdeteksi</p>
                    <p className="mt-1 text-xl font-bold">{resultsInsights.anomalies} kali</p>
                  </div>
                </div>

                {/* Average Sentiment */}
                <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/30">
                  <p className="text-sm text-blue-700 dark:text-blue-300">💙 Rata-rata Sentiment</p>
                  <p className="mt-1 text-2xl font-bold">{resultsInsights.avgScore.toFixed(4)}</p>
                </div>

                {/* Interpretation */}
                <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/30">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">📝 Interpretasi</p>
                  <p className="mt-2 text-sm text-foreground">
                    {resultsInsights.interpretation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
