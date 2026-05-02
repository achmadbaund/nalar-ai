"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Database,
  FileText,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsData {
  total_sources: number;
  active_sources: number;
  inactive_sources: number;
  total_articles: number;
  tier_1_sources: number;
  tier_2_sources: number;
  tier_3_sources: number;
}

interface HealthStatus {
  status: "healthy" | "unhealthy" | "checking";
  message: string;
}

export default function StatisticsPanel() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [health, setHealth] = useState<HealthStatus>({
    status: "checking",
    message: "Checking...",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Check health
    try {
      const healthRes = await fetch("/api/online-media/health");
      const healthData = await healthRes.json();
      setHealth({
        status: healthRes.ok ? "healthy" : "unhealthy",
        message: healthData.message || "Unknown status",
      });
    } catch (err) {
      setHealth({ status: "unhealthy", message: "Failed to connect" });
    }

    // Fetch basic stats by counting sources and articles
    try {
      // Get total sources count
      const sourcesRes = await fetch("/api/online-media/sources?page_size=1");
      const sourcesData = await sourcesRes.json();

      // Get total articles count (may fail, so handle separately)
      let articlesCount = 0;
      try {
        const articlesRes = await fetch(
          "/api/online-media/articles?page_size=1"
        );
        const articlesData = await articlesRes.json();
        articlesCount = articlesData.count || 0;
      } catch (articlesErr) {
        console.warn("Failed to fetch articles count:", articlesErr);
      }

      // Get active sources count
      const activeRes = await fetch(
        "/api/online-media/sources?active=true&page_size=1"
      );
      const activeData = await activeRes.json();

      // Get tier counts
      const tier1Res = await fetch(
        "/api/online-media/sources?tier=1&page_size=1"
      );
      const tier1Data = await tier1Res.json();

      const tier2Res = await fetch(
        "/api/online-media/sources?tier=2&page_size=1"
      );
      const tier2Data = await tier2Res.json();

      const tier3Res = await fetch(
        "/api/online-media/sources?tier=3&page_size=1"
      );
      const tier3Data = await tier3Res.json();

      setStats({
        total_sources: sourcesData.count || 0,
        active_sources: activeData.count || 0,
        inactive_sources: (sourcesData.count || 0) - (activeData.count || 0),
        total_articles: articlesCount,
        tier_1_sources: tier1Data.count || 0,
        tier_2_sources: tier2Data.count || 0,
        tier_3_sources: tier3Data.count || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }

    setLoading(false);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: number | string;
    icon: typeof Database;
    color: string;
  }) => (
    <div className='border rounded-lg p-4 bg-background'>
      <div className='flex items-center gap-3'>
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className='h-5 w-5' />
        </div>
        <div>
          <p className='text-sm text-muted-foreground'>{title}</p>
          <p className='text-2xl font-semibold'>{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Statistics & Health</h2>
        <button
          onClick={fetchData}
          className='text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1'
          disabled={loading}
        >
          {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : "Refresh"}
        </button>
      </div>

      {/* Health Status */}
      <div
        className={cn(
          "border rounded-lg p-4 flex items-center gap-3",
          health.status === "healthy"
            ? "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800"
            : health.status === "unhealthy"
            ? "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800"
            : "bg-gray-100 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800"
        )}
      >
        {health.status === "checking" ? (
          <Loader2 className='h-5 w-5 animate-spin' />
        ) : health.status === "healthy" ? (
          <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
        ) : (
          <XCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
        )}
        <div>
          <p className='font-medium'>
            API Status:{" "}
            {health.status === "checking"
              ? "Checking..."
              : health.status === "healthy"
              ? "Healthy"
              : "Unhealthy"}
          </p>
          <p className='text-sm text-muted-foreground'>{health.message}</p>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className='flex items-center justify-center py-8'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      ) : stats ? (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <StatCard
            title='Total Sources'
            value={stats.total_sources.toLocaleString()}
            icon={Database}
            color='bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
          />
          <StatCard
            title='Active Sources'
            value={stats.active_sources.toLocaleString()}
            icon={Activity}
            color='bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
          />
          <StatCard
            title='Total Articles'
            value={stats.total_articles.toLocaleString()}
            icon={FileText}
            color='bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
          />
          <StatCard
            title='Inactive Sources'
            value={stats.inactive_sources.toLocaleString()}
            icon={XCircle}
            color='bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          />
        </div>
      ) : (
        <div className='text-center py-8 text-muted-foreground'>
          Failed to load statistics
        </div>
      )}

      {/* Tier Distribution */}
      {stats && (
        <div className='border rounded-lg p-4'>
          <h3 className='font-medium mb-4'>Sources by Tier</h3>
          <div className='space-y-3'>
            <div className='flex items-center gap-4'>
              <span className='w-16 text-sm text-muted-foreground'>Tier 1</span>
              <div className='flex-1 bg-muted rounded-full h-3 overflow-hidden'>
                <div
                  className='h-full bg-red-500 dark:bg-red-600'
                  style={{
                    width: `${
                      stats.total_sources > 0
                        ? (stats.tier_1_sources / stats.total_sources) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className='w-16 text-sm text-right'>
                {stats.tier_1_sources.toLocaleString()}
              </span>
            </div>
            <div className='flex items-center gap-4'>
              <span className='w-16 text-sm text-muted-foreground'>Tier 2</span>
              <div className='flex-1 bg-muted rounded-full h-3 overflow-hidden'>
                <div
                  className='h-full bg-yellow-500 dark:bg-yellow-600'
                  style={{
                    width: `${
                      stats.total_sources > 0
                        ? (stats.tier_2_sources / stats.total_sources) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className='w-16 text-sm text-right'>
                {stats.tier_2_sources.toLocaleString()}
              </span>
            </div>
            <div className='flex items-center gap-4'>
              <span className='w-16 text-sm text-muted-foreground'>Tier 3</span>
              <div className='flex-1 bg-muted rounded-full h-3 overflow-hidden'>
                <div
                  className='h-full bg-green-500 dark:bg-green-600'
                  style={{
                    width: `${
                      stats.total_sources > 0
                        ? (stats.tier_3_sources / stats.total_sources) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className='w-16 text-sm text-right'>
                {stats.tier_3_sources.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
