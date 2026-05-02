"use client";

import { useEffect, useState } from "react";
import ChartTitle from "@/components/chart-blocks/components/chart-title";
import { Network } from "lucide-react";
import type { AIGatewayStats } from "@/components/ai-gateway/types";
import SummaryCards from "./components/summary-cards";
import Chart from "./chart";

export default function AIGatewayStats() {
  const [stats, setStats] = useState<AIGatewayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Since AI Gateway doesn't have a stats endpoint, we'll create mock data
      // based on the available services
      const mockStats: AIGatewayStats = {
        total_requests: 145000,
        active_services: 6,
        cache_hit_rate: 78.5,
        avg_response_time: 145,
        requests_by_service: {
          sentiment: 45000,
          aspect: 28000,
          entity: 21000,
          emotion: 18000,
          topic: 13000,
          trend: 20000,
        },
      };

      setStats(mockStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartTitle title="AI Gateway Statistics" icon={Network} />
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ChartTitle title="AI Gateway Statistics" icon={Network} />
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-destructive/10">
          <div className="text-center">
            <p className="text-destructive font-medium">Error loading data</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ChartTitle title="AI Gateway Statistics" icon={Network} />

      {stats && (
        <>
          <SummaryCards
            totalRequests={stats.total_requests}
            activeServices={stats.active_services}
            cacheHitRate={stats.cache_hit_rate}
            avgResponseTime={stats.avg_response_time}
          />

          <Chart data={stats} />
        </>
      )}
    </div>
  );
}
