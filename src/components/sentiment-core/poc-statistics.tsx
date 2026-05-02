"use client";

import { useEffect, useState } from "react";
import { Loader2, BarChart3 } from "lucide-react";
import { StatisticsResponse } from "./types";
import Chart from "../chart-blocks/charts/sentiment-statistics/chart";
import SummaryCards from "../chart-blocks/charts/sentiment-statistics/components/summary-cards";
import PlatformBreakdown from "../chart-blocks/charts/sentiment-statistics/components/platform-breakdown";
import PerformanceMetrics from "../chart-blocks/charts/sentiment-statistics/components/performance-metrics";

export default function PocStatistics() {
  const [data, setData] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (platform) params.set("platform", platform);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const response = await fetch(`/api/sentiment-core/statistics?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.detail || "Failed to fetch statistics");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch statistics");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => {
    fetchStatistics();
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Memuat statistik...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Tidak ada data statistik</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Filters
        </h3>
        <div className="grid grid-cols-1 gap-4 laptop:grid-cols-3">
          <div>
            <label className="block text-sm font-medium mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Platforms</option>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date From</label>
            <input
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date To</label>
            <input
              type="datetime-local"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleFilter}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          Apply Filters
        </button>
      </div>

      {/* Statistics Content */}
      {data.summary && <SummaryCards summary={data.summary} />}
      <div className="grid grid-cols-1 gap-4 laptop:grid-cols-2">
        <div className="relative flex min-h-64 flex-grow flex-col justify-center">
          {data.sentiment_distribution && (
            <Chart sentimentDistribution={data.sentiment_distribution} />
          )}
        </div>
        {data.platform_breakdown && (
          <PlatformBreakdown platformBreakdown={data.platform_breakdown} />
        )}
      </div>
      {data.performance_metrics && (
        <PerformanceMetrics performanceMetrics={data.performance_metrics} />
      )}
    </div>
  );
}

