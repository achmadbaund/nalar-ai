"use client";

import { useEffect, useState } from "react";
import ChartTitle from "@/components/chart-blocks/components/chart-title";
import { Database } from "lucide-react";
import type { ModelStatisticsSummary } from "@/components/model-management/types";
import SummaryCards from "./components/summary-cards";
import Chart from "./chart";

export default function ModelManagementStats() {
  const [stats, setStats] = useState<ModelStatisticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const modelsResponse = await fetch("/api/model-management/models");
      if (!modelsResponse.ok) {
        throw new Error("Failed to fetch models");
      }
      const modelsData = await modelsResponse.json();

      // API returns array directly, not wrapped in { models: [] }
      const models = Array.isArray(modelsData) ? modelsData : [];

      // Calculate statistics
      const totalModels = models.length;
      const activeModels = models.filter((m: any) => m.is_active).length;
      const totalStorage = models.reduce((sum: number, m: any) => sum + (m.file_size_mb || 0), 0);

      const modelsByType = {
        sentiment: models.filter((m: any) => m.model_type === "sentiment").length,
        emotion: models.filter((m: any) => m.model_type === "emotion").length,
        topic: models.filter((m: any) => m.model_type === "topic").length,
        aspect: models.filter((m: any) => m.model_type === "aspect").length,
        entity: models.filter((m: any) => m.model_type === "entity").length,
      };

      setStats({
        total_models: totalModels,
        active_models: activeModels,
        total_storage_mb: totalStorage,
        models_by_type: modelsByType,
      });
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
        <ChartTitle title="Model Management Statistics" icon={Database} />
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ChartTitle title="Model Management Statistics" icon={Database} />
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
      <ChartTitle title="Model Management Statistics" icon={Database} />

      {stats && (
        <>
          <SummaryCards
            totalModels={stats.total_models}
            activeModels={stats.active_models}
            totalStorage={stats.total_storage_mb}
          />

          <Chart data={stats} />
        </>
      )}
    </div>
  );
}
