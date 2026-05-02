"use client";

import { useState, useMemo } from "react";
import { TrendingUp, Calendar, Loader2, BarChart3, Table2, Lightbulb, XCircle } from "lucide-react";
import { VChart } from "@visactor/react-vchart";
import type { ILineChartSpec } from "@visactor/vchart";
import type { TrendAnalyzeResponse, TrendAnalyzeApiResponse, TrendGranularity, PostDetail, PostsByDateResponse } from "./types";
import { isTrendAnalyzeArray } from "./types";

export default function TrendAnalyze() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [granularity, setGranularity] = useState<TrendGranularity>("single");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrendAnalyzeApiResponse | null>(null);

  // Insights Modal
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  // Posts Modal
  const [postsModal, setPostsModal] = useState<{
    open: boolean;
    date: string | null;
    posts: PostDetail[];
    loading: boolean;
  }>({
    open: false,
    date: null,
    posts: [],
    loading: false,
  });

  // Derive single result for insights modal (type-safe)
  const singleResultForInsights = useMemo(() => {
    if (!result || isTrendAnalyzeArray(result)) return null;
    return result;
  }, [result]);

  // Get insights from single result
  const getAnalyzeInsights = (data: TrendAnalyzeResponse) => {
    const ma7Interpretation = data.moving_average_7d
      ? (data.avg_sentiment_score > data.moving_average_7d + 0.05 ? "di atas rata-rata (momentum positif)" :
        data.avg_sentiment_score < data.moving_average_7d - 0.05 ? "di bawah rata-rata (momentum negatif)" :
          "stabil sekitar rata-rata")
      : null;

    const bestSource = data.breakdowns?.by_source?.sort((a, b) => b.sentiment_score - a.sentiment_score)[0];

    return {
      trendType: data.trend_type === "upward" ? "Naik 📈" : data.trend_type === "downward" ? "Turun 📉" : "Stabil ➡️",
      ma7Interpretation,
      bestSource: bestSource ? `${bestSource.label} (${bestSource.sentiment_score.toFixed(3)})` : null,
      bestSourceScore: bestSource?.sentiment_score,
    };
  };

  // Fetch posts for clicked date
  const fetchPostsForDate = async (date: string) => {
    setPostsModal({ open: true, date, posts: [], loading: true });

    try {
      const response = await fetch(
        `/api/trend-analyzer/posts/by-date?target_date=${date}&limit=50`
      );

      if (response.ok) {
        const data: PostsByDateResponse = await response.json();
        setPostsModal(prev => ({ ...prev, posts: data.posts, loading: false }));
      } else {
        setPostsModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setPostsModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        granularity: granularity,
      });

      selectedSources.forEach(source => params.append('sources', source));


      const response = await fetch(`/api/trend-analyzer/analyze?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze trends");
      }

      const data: TrendAnalyzeApiResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze trends");
      setResult(null);
    } finally {
      setLoading(false);
    }
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

  // Prepare chart data for VChart
  const getChartSpec = (data: TrendAnalyzeResponse[]): ILineChartSpec => {
    // Transform data to format needed for multiple lines
    const chartData: Array<{ date: string; value: number; type: string }> = [];

    data.forEach((d) => {
      chartData.push({ date: d.date, value: d.avg_sentiment_score, type: "Sentiment Score" });
      if (d.moving_average_7d !== null) {
        chartData.push({ date: d.date, value: d.moving_average_7d, type: "MA-7D" });
      }
      if (d.moving_average_30d !== null) {
        chartData.push({ date: d.date, value: d.moving_average_30d, type: "MA-30D" });
      }
    });

    return {
      type: "line" as const,
      data: [
        {
          id: "trendData",
          values: chartData,
        },
      ],
      xField: "date",
      yField: "value",
      seriesField: "type",
      legends: {
        visible: true,
        orient: "bottom" as const,
        position: "middle" as const,
      },
      axes: [
        {
          orient: "bottom" as const,
          type: "band" as const,
          domainLine: { visible: true },
          label: {
            autoRotate: true,
          },
        },
        {
          orient: "left" as const,
          type: "linear" as const,
          min: 0,
          max: 1,
          domainLine: { visible: true },
          label: {
            formatMethod: (val: any) => {
              const numVal = typeof val === "number" ? val : parseFloat(val);
              return numVal.toFixed(2);
            },
          },
        },
      ],
      line: {
        style: {
          lineWidth: 2,
        },
      },
      point: {
        style: {
          size: 4,
          cursor: 'pointer',
        },
      },
      tooltip: {
        visible: true,
        mark: {
          content: [
            {
              key: (datum: any) => datum?.type,
              value: (datum: any) => datum?.value?.toFixed(4),
            },
          ],
        },
      },
    };
  };

  // Render single result view
  const renderSingleResult = (data: TrendAnalyzeResponse) => (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Analysis Results</h3>
        <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 laptop:grid-cols-4">
          <div className="rounded-lg bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="mt-1 text-lg font-semibold">{data.date}</p>
          </div>
          <div className="rounded-lg bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Trend Type</p>
            <p className={`mt-1 text-lg font-semibold ${getTrendColor(data.trend_type)}`}>
              {getTrendIcon(data.trend_type)} {data.trend_type.charAt(0).toUpperCase() + data.trend_type.slice(1)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Avg Sentiment Score</p>
            <p className="mt-1 text-lg font-semibold">{data.avg_sentiment_score.toFixed(4)}</p>
          </div>
          <div className="rounded-lg bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Spike Detected</p>
            <p className={`mt-1 text-lg font-semibold ${data.has_spike ? "text-orange-500" : "text-muted-foreground"}`}>
              {data.has_spike ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>

      {/* Moving Averages */}
      {(data.moving_average_7d !== null || data.moving_average_30d !== null) && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Moving Averages</h3>
          <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
            {data.moving_average_7d !== null && (
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">7-Day Moving Average</p>
                <p className="mt-1 text-xl font-semibold">{data.moving_average_7d.toFixed(4)}</p>
              </div>
            )}
            {data.moving_average_30d !== null && (
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">30-Day Moving Average</p>
                <p className="mt-1 text-xl font-semibold">{data.moving_average_30d.toFixed(4)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Spike Information */}
      {data.has_spike && data.spike_percentage !== null && (
        <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 p-6">
          <h3 className="mb-4 text-lg font-semibold text-orange-500">⚠️ Spike Detected</h3>
          <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Spike Percentage</p>
              <p className="mt-1 text-xl font-semibold">{data.spike_percentage.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Direction</p>
              <p className={`mt-1 text-xl font-semibold ${data.spike_direction === "positive" ? "text-green-500" : "text-red-500"}`}>
                {data.spike_direction === "positive" ? "Positive ↑" : "Negative ↓"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Anomaly Information */}
      {data.has_anomaly && data.anomaly_description && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6">
          <h3 className="mb-4 text-lg font-semibold text-red-500">⚠️ Anomaly Detected</h3>
          <p className="text-sm text-muted-foreground">Method: {data.anomaly_method}</p>
          <p className="mt-2">{data.anomaly_description}</p>
        </div>
      )}

      {/* Statistics */}
      {data.statistics && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Statistical Analysis</h3>
          <div className="grid grid-cols-1 gap-4 phone:grid-cols-3">
            <div className="rounded-lg bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Mean</p>
              <p className="mt-1 text-lg font-semibold">{data.statistics.mean.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Std Deviation</p>
              <p className="mt-1 text-lg font-semibold">{data.statistics.std.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Variance</p>
              <p className="mt-1 text-lg font-semibold">{data.statistics.variance.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Min</p>
              <p className="mt-1 text-lg font-semibold">{data.statistics.min.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Max</p>
              <p className="mt-1 text-lg font-semibold">{data.statistics.max.toFixed(4)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Median</p>
              <p className="mt-1 text-lg font-semibold">{data.statistics.median.toFixed(4)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Breakdowns Feature Extraction - from HEAD/main */}
      {data.breakdowns && (
        <>
          {/* Feature Extraction Indicator */}
          <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
            <h4 className="mb-2 font-semibold text-blue-700 dark:text-blue-300">
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
              Analyzed {data.breakdowns.total_posts} posts across {data.breakdowns.by_source.length} platforms
              {data.breakdowns.by_topic.length > 0 && ` and ${data.breakdowns.by_topic.length} topic categories`}
            </p>
          </div>

          {/* Breakdown by Source */}
          {data.breakdowns.by_source.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <span>📱</span>
                Sentiment by Source Platform
              </h4>
              <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 laptop:grid-cols-3">
                {data.breakdowns.by_source.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.count} posts</p>
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
          {data.breakdowns.by_topic.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <span>🏷️</span>
                Sentiment by Topic Category
              </h4>
              <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 laptop:grid-cols-3">
                {data.breakdowns.by_topic.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.count} posts</p>
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

          {/* Insights Button */}
          <button
            onClick={() => setShowInsightsModal(true)}
            className="flex items-center justify-center gap-2 rounded-md border border-border bg-green-500/10 px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-500/20 dark:text-green-300 dark:hover:bg-green-500/20"
          >
            <Lightbulb className="h-4 w-4" />
            Lihat Kesimpulan
          </button>
        </>
      )}
    </div>
  );

  // Render daily time series view
  const renderDailyResults = (data: TrendAnalyzeResponse[]) => (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Daily Time Series Analysis</h3>
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

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("chart")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm ${viewMode === "chart" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
        >
          <BarChart3 className="h-4 w-4" />
          Chart View
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm ${viewMode === "table" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
        >
          <Table2 className="h-4 w-4" />
          Table View
        </button>
      </div>

      {/* Chart View */}
      {viewMode === "chart" && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Sentiment Trend Chart</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Klik pada titik di grafik untuk melihat posts pada tanggal tersebut
          </p>
          <div className="h-[400px]">
            <VChart
              spec={getChartSpec(data)}
              onClick={(e: any) => {
                // Get clicked datum
                const datum = e?.data?.datum;
                if (datum?.date) {
                  fetchPostsForDate(datum.date);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
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
                    <td className="px-4 py-3">{row.date}</td>
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
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Analyze Sentiment Trends</h3>

        {/* Granularity Toggle */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Analysis Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setGranularity("single")}
              className={`flex-1 rounded-md px-4 py-2 text-sm ${granularity === "single" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              Single Date
            </button>
            <button
              onClick={() => setGranularity("daily")}
              className={`flex-1 rounded-md px-4 py-2 text-sm ${granularity === "daily" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
            >
              Daily Time Series
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {granularity === "single"
              ? "Analyze a single target date using the date range for historical context"
              : "Get daily analysis for each day in the selected date range"}
          </p>
        </div>

        {/* Source Selector */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">Data Sources</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "social_media", label: "Social Media" },
              { id: "news", label: "Online News" },
              { id: "print", label: "Print Media" },
              { id: "broadcast", label: "Broadcast" },
            ].map((source) => (
              <button
                key={source.id}
                onClick={() => {
                  setSelectedSources((prev) =>
                    prev.includes(source.id)
                      ? prev.filter((s) => s !== source.id)
                      : [...prev, source.id]
                  );
                }}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${selectedSources.includes(source.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
              >
                {source.label}
              </button>
            ))}
            <button
              onClick={() => setSelectedSources([])}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${selectedSources.length === 0
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
            >
              All Sources
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Select specific sources or leave empty for all sources.</p>
        </div>

        {/* Date Inputs */}

        <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-4 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              Analyze Trends
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {
        error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="font-medium text-destructive">Error</p>
            <p className="mt-1 text-sm text-destructive/80">{error}</p>
          </div>
        )
      }

      {/* Results */}
      {result && (isTrendAnalyzeArray(result) ? renderDailyResults(result) : renderSingleResult(result))}

      {/* Posts Modal */}
      {
        postsModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPostsModal(prev => ({ ...prev, open: false }))}>
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-border bg-card shadow-lg" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-6">
                <div>
                  <h3 className="text-xl font-semibold">
                    Posts untuk {postsModal.date ? new Date(postsModal.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Total {postsModal.posts.length} posts
                  </p>
                </div>
                <button
                  onClick={() => setPostsModal(prev => ({ ...prev, open: false }))}
                  className="rounded-md p-2 hover:bg-muted"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {postsModal.loading ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : postsModal.posts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Tidak ada posts untuk tanggal ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Filter by platform */}
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground">
                        Semua ({postsModal.posts.length})
                      </button>
                      {/* Platform filters can be added here */}
                    </div>

                    {/* Posts list */}
                    <div className="space-y-3">
                      {postsModal.posts.map((post) => (
                        <div key={post.id} className="rounded-lg border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <span className="px-2 py-0.5 rounded bg-muted font-medium">
                                  {post.platform}
                                </span>
                                <span>•</span>
                                <span>{post.topic}</span>
                                <span>•</span>
                                <span className={post.sentiment_score > 0.5 ? "text-green-600" : "text-red-600"}>
                                  {post.sentiment_label}
                                </span>
                                <span>•</span>
                                <span>{post.sentiment_score.toFixed(3)}</span>
                              </div>
                              <p className="text-sm line-clamp-4">{post.content}</p>
                            </div>
                            {post.url && (
                              <a
                                href={post.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline whitespace-nowrap"
                              >
                                Buka →
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Insights Modal */}
      {
        showInsightsModal && singleResultForInsights && (() => {
          const insights = getAnalyzeInsights(singleResultForInsights);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowInsightsModal(false)}>
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card shadow-lg" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-6">
                  <div>
                    <h3 className="text-xl font-semibold">📊 Kesimpulan Tren</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Interpretasi hasil analisis tren
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
                    {/* Trend Type */}
                    <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/30">
                      <p className="text-sm text-green-700 dark:text-green-300">Tipe Tren</p>
                      <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-300">
                        {insights.trendType}
                      </p>
                    </div>

                    {/* Sentiment Score */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-muted/20 p-4">
                        <p className="text-sm text-muted-foreground">Sentiment Score</p>
                        <p className="mt-1 text-lg font-semibold">
                          {singleResultForInsights.avg_sentiment_score.toFixed(4)}
                        </p>
                      </div>
                      {singleResultForInsights.moving_average_7d && (
                        <div className="rounded-lg bg-muted/20 p-4">
                          <p className="text-sm text-muted-foreground">MA 7-Hari</p>
                          <p className="mt-1 text-lg font-semibold">
                            {singleResultForInsights.moving_average_7d.toFixed(4)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* MA7 Interpretation */}
                    {insights.ma7Interpretation && (
                      <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/30">
                        <p className="text-sm text-blue-700 dark:text-blue-300">📈 Analisis Momentum</p>
                        <p className="mt-1 font-semibold">{insights.ma7Interpretation}</p>
                      </div>
                    )}

                    {/* Spike */}
                    {singleResultForInsights.has_spike && (
                      <div className="rounded-lg bg-orange-500/10 p-4 border border-orange-500/30">
                        <p className="text-sm text-orange-700 dark:text-orange-300">⚡ Spike Terdeteksi</p>
                        <p className="mt-1 font-semibold">
                          {singleResultForInsights.spike_direction === "positive" ? "Positif " : "Negatif "}
                          ({singleResultForInsights.spike_percentage?.toFixed(2)}%)
                        </p>
                      </div>
                    )}

                    {/* Anomaly */}
                    {singleResultForInsights.has_anomaly && (
                      <div className="rounded-lg bg-red-500/10 p-4 border border-red-500/30">
                        <p className="text-sm text-red-700 dark:text-red-300">🔍 Anomaly Terdeteksi</p>
                        <p className="mt-1 font-semibold">
                          {singleResultForInsights.anomaly_method?.toUpperCase()}: {singleResultForInsights.anomaly_description}
                        </p>
                      </div>
                    )}

                    {/* Best Source */}
                    {insights.bestSource && (
                      <div className="rounded-lg bg-purple-500/10 p-4 border border-purple-500/30">
                        <p className="text-sm text-purple-700 dark:text-purple-300">📱 Platform Terbaik</p>
                        <p className="mt-1 font-semibold">{insights.bestSource}</p>
                      </div>
                    )}

                    {/* Conclusion */}
                    <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/30">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">📝 Kesimpulan</p>
                      <p className="mt-2 text-sm">
                        {singleResultForInsights.trend_type === "upward"
                          ? "Sentiment sedang dalam tren naik. Brand perception sedang meningkat secara positif."
                          : singleResultForInsights.trend_type === "downward"
                            ? "Sentiment sedang dalam tren turun. Perlu evaluasi dan tindakan perbaikan."
                            : "Sentiment stabil. Tidak ada perubahan signifikan dalam periode ini."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      }
    </div >
  );
}
