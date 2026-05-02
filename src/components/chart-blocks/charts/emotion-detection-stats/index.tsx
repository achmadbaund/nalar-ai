"use client";

import { useEffect, useState, useMemo } from "react";
import { Smile, Loader2 } from "lucide-react";
import ChartTitle from "../../components/chart-title";
import Chart from "./chart";
import MetricCard from "../average-tickets-created/components/metric-card";

interface EmotionResult {
  content_id: number;
  dominant_emotion: string;
  anger_score: number;
  joy_score: number;
  sadness_score: number;
  fear_score: number;
  surprise_score: number;
  id: number;
  created_at: string;
}

interface EmotionStatsResponse {
  total: number;
  skip: number;
  limit: number;
  results: EmotionResult[];
}

export default function EmotionDetectionStats() {
  const [data, setData] = useState<EmotionStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all results with large limit
        const response = await fetch("/api/emotion-detection/results?skip=0&limit=1000", {
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

        const responseData: EmotionStatsResponse = await response.json();
        setData(responseData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch emotion detection data");
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
        <ChartTitle title="Total Emotion Detection per Tanggal" icon={Smile} />
        <div className="flex min-h-32 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memuat data emotion detection...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex h-full flex-col gap-2">
        <ChartTitle title="Total Emotion Detection per Tanggal" icon={Smile} />
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
        <ChartTitle title="Total Emotion Detection per Tanggal" icon={Smile} />
        <div className="flex min-h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Tidak ada data emotion detection</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ChartTitle title="Total Emotion Detection per Tanggal" icon={Smile} />
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
            color="#F59E0B"
          />
          <MetricCard
            title="Avg. per Day"
            value={metrics.avgPerDay}
            color="#FBBF24"
          />
        </div>
        <div className="relative h-96 min-w-[320px] flex-1">
          <Chart data={data.results} />
        </div>
      </div>
    </section>
  );
}

