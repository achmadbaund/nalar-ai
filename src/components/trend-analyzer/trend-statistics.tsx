"use client";

import { useEffect, useState } from "react";
import { PieChart, Loader2 } from "lucide-react";
import type { TrendStatisticsSummary } from "./types";

export default function TrendStatistics() {
  const [summary, setSummary] = useState<TrendStatisticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/trend-analyzer/statistics/summary");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch statistics");
      }

      const data: TrendStatisticsSummary = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-medium">Error loading statistics</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
        No statistics available
      </div>
    );
  }

  const trendTypeCounts = summary.trend_type_counts || {
    upward: 0,
    downward: 0,
    stable: 0,
  };

  const totalTrends =
    trendTypeCounts.upward + trendTypeCounts.downward + trendTypeCounts.stable;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 laptop:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Trends</p>
              <p className="mt-2 text-3xl font-bold">{summary.total_trends_detected}</p>
            </div>
            <div className="rounded-full bg-blue-500/10 p-3">
              <PieChart className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Spikes Detected</p>
              <p className="mt-2 text-3xl font-bold text-orange-500">
                {summary.total_spikes_detected}
              </p>
            </div>
            <div className="rounded-full bg-orange-500/10 p-3">
              <div className="h-6 w-6 text-orange-500">⚡</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Most Common Trend</p>
              <p className="mt-2 text-xl font-bold capitalize">
                {summary.most_common_trend_type || "N/A"}
              </p>
            </div>
            <div
              className={`rounded-full p-3 ${
                summary.most_common_trend_type === "upward"
                  ? "bg-green-500/10"
                  : summary.most_common_trend_type === "downward"
                  ? "bg-red-500/10"
                  : "bg-yellow-500/10"
              }`}
            >
              <div className="h-6 w-6">
                {summary.most_common_trend_type === "upward"
                  ? "📈"
                  : summary.most_common_trend_type === "downward"
                  ? "📉"
                  : "➡️"}
              </div>
            </div>
          </div>
        </div>

        {summary.date_range && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div>
              <p className="text-sm text-muted-foreground">Date Range</p>
              <p className="mt-2 text-sm font-medium">{summary.date_range.earliest}</p>
              <p className="text-sm text-muted-foreground">to</p>
              <p className="text-sm font-medium">{summary.date_range.latest}</p>
            </div>
          </div>
        )}
      </div>

      {/* Trend Type Distribution */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Trend Type Distribution</h3>
        <div className="space-y-4">
          {/* Upward */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span>📈</span>
                <span>Upward</span>
              </span>
              <span className="font-medium">
                {trendTypeCounts.upward} ({totalTrends > 0 ? ((trendTypeCounts.upward / totalTrends) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-green-500"
                style={{
                  width: `${totalTrends > 0 ? (trendTypeCounts.upward / totalTrends) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Downward */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span>📉</span>
                <span>Downward</span>
              </span>
              <span className="font-medium">
                {trendTypeCounts.downward} ({totalTrends > 0 ? ((trendTypeCounts.downward / totalTrends) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-red-500"
                style={{
                  width: `${totalTrends > 0 ? (trendTypeCounts.downward / totalTrends) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Stable */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span>➡️</span>
                <span>Stable</span>
              </span>
              <span className="font-medium">
                {trendTypeCounts.stable} ({totalTrends > 0 ? ((trendTypeCounts.stable / totalTrends) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-yellow-500"
                style={{
                  width: `${totalTrends > 0 ? (trendTypeCounts.stable / totalTrends) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Spike Statistics */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Spike Detection Statistics</h3>
        <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
          <div className="rounded-lg bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Total Spikes</p>
            <p className="mt-2 text-2xl font-bold text-orange-500">
              {summary.total_spikes_detected}
            </p>
          </div>
          <div className="rounded-lg bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Spike Rate</p>
            <p className="mt-2 text-2xl font-bold">
              {totalTrends > 0 ? ((summary.total_spikes_detected / totalTrends) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
