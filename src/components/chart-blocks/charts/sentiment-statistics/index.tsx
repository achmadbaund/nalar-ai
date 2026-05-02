"use client";

import { useEffect, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import ChartTitle from "../../components/chart-title";
import Chart from "./chart";
import SummaryCards from "./components/summary-cards";
import PlatformBreakdown from "./components/platform-breakdown";
import PerformanceMetrics from "./components/performance-metrics";

interface SentimentDistribution {
  positive: {
    count: number;
    percentage: number;
    avg_score: number;
  };
  negative: {
    count: number;
    percentage: number;
    avg_score: number;
  };
  neutral: {
    count: number;
    percentage: number;
    avg_score: number;
  };
}

interface PlatformBreakdownData {
  [platform: string]: {
    count: number;
    positive: number;
    negative: number;
    neutral: number;
  };
}

interface StatisticsResponse {
  summary: {
    total_posts_analyzed: number;
    date_range: {
      from: string;
      to: string;
    };
    avg_processing_time: number;
    avg_confidence: number;
  };
  sentiment_distribution: SentimentDistribution;
  platform_breakdown: PlatformBreakdownData;
  performance_metrics: {
    latency_percentiles: {
      p50: number;
      p95: number;
      p99: number;
      max: number;
    };
    confidence_distribution: {
      high: number;
      medium: number;
      low: number;
    };
    text_length_stats: {
      avg: number;
      min: number;
      max: number;
    };
  };
  hourly_trend: Array<{
    hour: string;
    count: number;
    positive: number;
    negative: number;
    neutral: number;
  }>;
}

export default function SentimentStatistics() {
  const [data, setData] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/sentiment/statistics", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`,
          );
        }

        const statisticsData: StatisticsResponse = await response.json();
        
        // Debug: Log data untuk melihat apa yang dikembalikan backend
        console.log("[Sentiment Statistics] Data dari backend:", statisticsData);
        console.log("[Sentiment Statistics] Total posts:", statisticsData?.summary?.total_posts_analyzed);
        
        setData(statisticsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch statistics");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
    // Refresh setiap 60 detik
    const interval = setInterval(fetchStatistics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <section className="flex h-full flex-col gap-2 w-full">
        <ChartTitle title="Sentiment Statistics" icon={BarChart3} />
        <div className="flex min-h-32 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memuat statistik sentiment...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex h-full flex-col gap-2 w-full">
        <ChartTitle title="Sentiment Statistics" icon={BarChart3} />
        <div className="flex min-h-32 items-center justify-center">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="flex h-full flex-col gap-2 w-full">
        <ChartTitle title="Sentiment Statistics" icon={BarChart3} />
        <div className="flex min-h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Tidak ada data statistik</p>
        </div>
      </section>
    );
  }

  // Cek apakah data benar-benar kosong (semua nilai 0 atau tidak ada data)
  const hasNoData = 
    (!data.summary?.total_posts_analyzed || data.summary.total_posts_analyzed === 0) &&
    (!data.sentiment_distribution || 
      ((data.sentiment_distribution.positive?.count || 0) === 0 &&
       (data.sentiment_distribution.negative?.count || 0) === 0 &&
       (data.sentiment_distribution.neutral?.count || 0) === 0));

  if (hasNoData) {
    return (
      <section className="flex h-full flex-col gap-2 w-full">
        <ChartTitle title="Sentiment Statistics" icon={BarChart3} />
        <div className="flex min-h-32 items-center justify-center">
          <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Belum ada data yang dianalisis
            </p>
            <p className="text-xs text-muted-foreground">
              Data akan muncul setelah ada post yang dianalisis melalui Sentiment Core
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col gap-4 w-full">
      <ChartTitle title="Sentiment Statistics" icon={BarChart3} />
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
    </section>
  );
}

