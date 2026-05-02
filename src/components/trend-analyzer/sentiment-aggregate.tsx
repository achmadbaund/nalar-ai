"use client";

import { useState } from "react";
import { BarChart3, Calendar, Loader2 } from "lucide-react";
import type { AggregateRequest, AggregateResponse, AggregationType } from "./types";

export default function SentimentAggregate() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [aggregationType, setAggregationType] = useState<AggregationType>("daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AggregateResponse | null>(null);

  const handleAggregate = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const requestBody: AggregateRequest = {
        start_date: startDate,
        end_date: endDate,
        aggregation_type: aggregationType,
      };

      const response = await fetch("/api/trend-analyzer/aggregate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to aggregate sentiment data");
      }

      const data: AggregateResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to aggregate data");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Aggregate Sentiment Data</h3>
        <div className="grid grid-cols-1 gap-4 phone:grid-cols-3">
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
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4" />
              Aggregation Type
            </label>
            <select
              value={aggregationType}
              onChange={(e) => setAggregationType(e.target.value as AggregationType)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleAggregate}
          disabled={loading}
          className="mt-4 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Aggregating...
            </>
          ) : (
            <>
              <BarChart3 className="h-4 w-4" />
              Aggregate Data
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">Error</p>
          <p className="mt-1 text-sm text-destructive/80">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Aggregation Summary</h3>
            <div className="grid grid-cols-1 gap-4 phone:grid-cols-4">
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Aggregation Type</p>
                <p className="mt-1 text-lg font-semibold capitalize">
                  {result.aggregation_type}
                </p>
              </div>
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Data Points</p>
                <p className="mt-1 text-lg font-semibold">{result.count}</p>
              </div>
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Period Start</p>
                <p className="mt-1 text-lg font-semibold">{result.start_date}</p>
              </div>
              <div className="rounded-lg bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">Period End</p>
                <p className="mt-1 text-lg font-semibold">{result.end_date}</p>
              </div>
            </div>
          </div>

          {/* Simple Chart Visualization */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Sentiment Over Time</h3>
            <div className="relative h-[300px] w-full">
              {result.data.length > 0 ? (
                <div className="flex h-full items-end justify-between gap-2">
                  {result.data.map((point, index) => {
                    const maxScore = Math.max(...result.data.map((d) => d.sentiment_score));
                    const height = maxScore > 0 ? (point.sentiment_score / maxScore) * 100 : 0;
                    return (
                      <div
                        key={index}
                        className="group relative flex-1 rounded-t-md bg-primary transition-all hover:bg-primary/80"
                        style={{ height: `${height}%`, minHeight: "4px" }}
                      >
                        <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-border px-2 py-1 text-xs group-hover:block">
                          <div>Date: {point.date}</div>
                          <div>Score: {point.sentiment_score.toFixed(4)}</div>
                          <div>Count: {point.count}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No data points available
                </div>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Sentiment Score</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.data.map((point, index) => (
                  <tr key={index} className="hover:bg-muted/20">
                    <td className="px-4 py-3 text-sm">{point.date}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      {point.sentiment_score.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">{point.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
