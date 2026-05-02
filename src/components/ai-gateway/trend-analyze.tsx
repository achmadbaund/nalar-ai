"use client";

import { useState } from "react";
import { TrendingUp, Calendar, AlertCircle } from "lucide-react";
import type { TrendAnalysisResponse } from "./types";

export default function TrendAnalyze() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrendAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeTrend = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/ai-gateway/trend?start=${startDate}&end=${endDate}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: TrendAnalysisResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze trend");
    } finally {
      setLoading(false);
    }
  };

  const getTrendTypeColor = (trendType: string) => {
    switch (trendType) {
      case "upward":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900";
      case "downward":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
      case "stable":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-700";
    }
  };

  const getTrendIcon = (trendType: string) => {
    switch (trendType) {
      case "upward":
        return "↗️";
      case "downward":
        return "↘️";
      case "stable":
        return "→";
      default:
        return "—";
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trend Analysis Parameters
        </h3>

        <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
          </div>
        </div>

        <button
          onClick={analyzeTrend}
          disabled={loading}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Trend"}
        </button>
      </div>

      {/* Error Section */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-100">Error</h4>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h4 className="mb-4 text-lg font-semibold">Trend Summary</h4>

            <div className="grid grid-cols-1 gap-4 phone:grid-cols-3">
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="mt-1 text-xl font-bold text-foreground">{result.date}</p>
              </div>

              <div className={`rounded-lg border-2 p-4 ${getTrendTypeColor(result.trend_type)}`}>
                <p className="text-sm opacity-70">Trend Type</p>
                <div className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold">
                  <span className="text-3xl">{getTrendIcon(result.trend_type)}</span>
                  <span className="capitalize">{result.trend_type}</span>
                </div>
              </div>

              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Avg Sentiment Score</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {result.avg_sentiment_score.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Moving Averages */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h4 className="mb-4 text-lg font-semibold">Moving Averages</h4>
            <div className="grid grid-cols-1 gap-4 phone:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">7-Day MA</span>
                <span className="text-lg font-semibold text-foreground">
                  {result.moving_average_7d.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">30-Day MA</span>
                <span className="text-lg font-semibold text-foreground">
                  {result.moving_average_30d.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Spike Analysis */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h4 className="mb-4 text-lg font-semibold">Spike Analysis</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">Has Spike</span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    result.has_spike
                      ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {result.has_spike ? "Yes" : "No"}
                </span>
              </div>
              {result.has_spike && (
                <>
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Spike Percentage</span>
                    <span className="text-lg font-semibold text-foreground">
                      {result.spike_percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Direction</span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${
                        result.spike_direction === "positive"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {result.spike_direction}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Anomaly Detection */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h4 className="mb-4 text-lg font-semibold">Anomaly Detection</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">Has Anomaly</span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    result.has_anomaly
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {result.has_anomaly ? "Yes" : "No"}
                </span>
              </div>
              {result.has_anomaly && result.anomaly_description && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1 text-sm text-foreground">{result.anomaly_description}</p>
                </div>
              )}
              <div className="rounded-lg bg-muted/30 px-4 py-3">
                <p className="text-sm text-muted-foreground">Method</p>
                <p className="mt-1 text-sm font-mono text-foreground">{result.anomaly_method}</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h4 className="mb-4 text-lg font-semibold">Statistical Analysis</h4>
            <div className="grid grid-cols-2 gap-3 phone:grid-cols-3">
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Mean</p>
                <p className="text-sm font-semibold text-foreground">{result.statistics.mean.toFixed(4)}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Std Dev</p>
                <p className="text-sm font-semibold text-foreground">{result.statistics.std.toFixed(4)}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Variance</p>
                <p className="text-sm font-semibold text-foreground">{result.statistics.variance.toFixed(4)}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Min</p>
                <p className="text-sm font-semibold text-foreground">{result.statistics.min.toFixed(4)}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Max</p>
                <p className="text-sm font-semibold text-foreground">{result.statistics.max.toFixed(4)}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Median</p>
                <p className="text-sm font-semibold text-foreground">{result.statistics.median.toFixed(4)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
