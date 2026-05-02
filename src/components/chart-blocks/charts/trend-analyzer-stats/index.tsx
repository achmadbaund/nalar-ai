"use client";

import { useEffect, useState } from "react";
import ChartTitle from "@/components/chart-blocks/components/chart-title";
import { TrendingUp } from "lucide-react";
import type { TrendResult, TrendStatisticsSummary } from "@/components/trend-analyzer/types";
import SummaryCards from "./components/summary-cards";
import Chart from "./chart";

export default function TrendAnalyzerStats() {
  const [data, setData] = useState<TrendResult[]>([]);
  const [summary, setSummary] = useState<TrendStatisticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trend results
      const resultsResponse = await fetch("/api/trend-analyzer/results");
      if (!resultsResponse.ok) {
        throw new Error("Failed to fetch trend results");
      }
      const resultsData: TrendResult[] = await resultsResponse.json();

      // Fetch statistics summary
      const summaryResponse = await fetch("/api/trend-analyzer/statistics/summary");
      if (!summaryResponse.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const summaryData: TrendStatisticsSummary = await summaryResponse.json();

      setData(resultsData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartTitle title="Trend Analyzer Statistics" icon={TrendingUp} />
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ChartTitle title="Trend Analyzer Statistics" icon={TrendingUp} />
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-destructive/10">
          <div className="text-center">
            <p className="text-destructive font-medium">Error loading data</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!summary || data.length === 0) {
    return (
      <div className="space-y-6">
        <ChartTitle title="Trend Analyzer Statistics" icon={TrendingUp} />
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
          <p className="text-muted-foreground">No trend data available</p>
        </div>
      </div>
    );
  }

  // Calculate average sentiment from data
  const avgSentiment =
    data.reduce((sum, d) => sum + d.avg_sentiment_score, 0) / data.length;

  return (
    <div className="space-y-6">
      <ChartTitle title="Trend Analyzer Statistics" icon={TrendingUp} />

      <SummaryCards
        totalTrends={summary.total_trends_detected || data.length}
        totalSpikes={summary.total_spikes_detected || 0}
        avgSentiment={avgSentiment}
        mostCommonTrend={summary.most_common_trend_type || "stable"}
      />

      <Chart data={data} />
    </div>
  );
}
