"use client";

import { useEffect, useState, useMemo } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import ChartTitle from "../../components/chart-title";
import Chart from "./chart";
import MetricCard from "../average-tickets-created/components/metric-card";

interface AspectResult {
  content_id: number;
  aspect: string;
  sentiment_label: string;
  sentiment_score: number;
  mention_count: number;
  context_sentences: string[];
  created_at: string;
}

interface AspectStatsResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: AspectResult[];
}

export default function AspectSentimentStats() {
  const [data, setData] = useState<AspectStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch results with maximum allowed page size (100)
        const response = await fetch("/api/aspect-sentiment/results?page=1&page_size=100", {
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

        const responseData: AspectStatsResponse = await response.json();
        setData(responseData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch aspect sentiment data");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh setiap 60 detik
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!data || !data.results || data.results.length === 0) {
      return { totalAnalyzed: 0, avgPerDay: 0 };
    }

    const totalAnalyzed = data.total;
    
    // Group by date
    const dateMap = new Map<string, number>();
    data.results.forEach((result) => {
      const createdDate = result.created_at
        ? new Date(result.created_at).toISOString().split("T")[0]
        : null;
      if (createdDate) {
        dateMap.set(createdDate, (dateMap.get(createdDate) || 0) + 1);
      }
    });

    const uniqueDays = dateMap.size;
    const avgPerDay = uniqueDays > 0 ? Math.round(totalAnalyzed / uniqueDays) : 0;

    return { totalAnalyzed, avgPerDay };
  }, [data]);

  if (loading && !data) {
    return (
      <section className="flex h-full flex-col gap-2">
        <ChartTitle title="Total Aspect Sentiment per Tanggal" icon={Sparkles} />
        <div className="flex min-h-32 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memuat data aspect sentiment...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex h-full flex-col gap-2">
        <ChartTitle title="Total Aspect Sentiment per Tanggal" icon={Sparkles} />
        <div className="flex min-h-32 items-center justify-center">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!data || !data.results || data.results.length === 0) {
    return (
      <section className="flex h-full flex-col gap-2">
        <ChartTitle title="Total Aspect Sentiment per Tanggal" icon={Sparkles} />
        <div className="flex min-h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Tidak ada data aspect sentiment</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ChartTitle title="Total Aspect Sentiment per Tanggal" icon={Sparkles} />
        {data && (
          <div className="text-xs text-muted-foreground">
            Total: {data.total} results
          </div>
        )}
      </div>
      <div className="flex flex-wrap">
        <div className="my-4 flex w-52 shrink-0 flex-col justify-center gap-6">
          <MetricCard
            title="Total Analyzed"
            value={metrics.totalAnalyzed}
            color="#8B5CF6"
          />
          <MetricCard
            title="Avg. per Day"
            value={metrics.avgPerDay}
            color="#A78BFA"
          />
        </div>
        <div className="relative h-96 min-w-[320px] flex-1">
          <Chart data={data.results} />
        </div>
      </div>
    </section>
  );
}

