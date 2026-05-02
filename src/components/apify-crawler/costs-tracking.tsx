"use client";

import { useEffect, useState } from "react";
import { Loader2, DollarSign, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Platform } from "./types";

interface Cost {
  id: number;
  platform: string;
  actor_name: string;
  run_id: string;
  compute_units: number;
  cost_usd: number;
  items_scraped: number;
  run_duration_seconds: number;
  created_at: string;
}

interface CostsResponse {
  costs: Cost[];
  total_cost_usd: number;
  by_platform: Record<string, number>;
  period: {
    start_date: string;
    end_date: string;
  };
}

export default function CostsTracking() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CostsResponse | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Set default date range (last 3 months)
  useEffect(() => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(threeMonthsAgo.toISOString().split("T")[0]);
  }, []);

  const fetchCosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);
      if (platform) params.set("platform", platform);

      const url = `/api/costs?${params.toString()}`;
      console.log("Fetching costs from:", url);

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch costs");
      }

      console.log("Costs data received:", {
        totalCost: result.total_cost_usd,
        costsCount: result.costs?.length || 0,
        platforms: Object.keys(result.by_platform || {}),
        period: result.period,
        firstFewCosts: result.costs?.slice(0, 3),
      });

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch costs");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch costs when component mounts or filters change
    fetchCosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, platform]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      tiktok: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950",
      instagram: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950",
      facebook: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950",
      twitter: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950",
      youtube: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
    };
    return colors[platform.toLowerCase()] || "text-muted-foreground bg-muted";
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Memuat data costs...</span>
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Sembunyikan" : "Tampilkan"} Filter
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-4 laptop:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
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
          </div>
        )}
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 laptop:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Total Cost</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(data.total_cost_usd)}</p>
              {data.period && (
                <p className="text-xs text-muted-foreground mt-1">
                  {data.period.start_date} - {data.period.end_date}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Records</span>
                {platform && (
                  <span className="text-xs text-muted-foreground">(filtered by {platform})</span>
                )}
              </div>
              <p className="text-2xl font-bold">{data.costs?.length || 0}</p>
              {data.period && (
                <p className="text-xs text-muted-foreground mt-1">
                  {data.period.start_date} - {data.period.end_date}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">Platforms</span>
              </div>
              <p className="text-2xl font-bold">{Object.keys(data.by_platform || {}).length}</p>
              {data.by_platform && Object.keys(data.by_platform).length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {Object.keys(data.by_platform).join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Platform Breakdown */}
          {data.by_platform && Object.keys(data.by_platform).length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold mb-4">Cost by Platform</h3>
              <div className="grid grid-cols-2 gap-4 laptop:grid-cols-5">
                {Object.entries(data.by_platform).map(([platform, cost]) => (
                  <div key={platform} className="text-center">
                    <div
                      className={`px-3 py-1 rounded text-xs font-medium capitalize mb-2 inline-block ${getPlatformColor(platform)}`}
                    >
                      {platform}
                    </div>
                    <p className="text-lg font-semibold">{formatCurrency(cost)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Costs List */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4">Cost Details</h3>
            {data.costs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada data costs untuk periode yang dipilih
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {data.costs.map((cost) => (
                  <div
                    key={cost.id}
                    className="rounded-lg border border-border bg-muted/50 p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPlatformColor(cost.platform)}`}
                          >
                            {cost.platform}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {cost.actor_name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>Run ID: <span className="font-mono">{cost.run_id}</span></p>
                          <p>Created: {formatDate(cost.created_at)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-border">
                          <div>
                            <span className="text-muted-foreground">Compute Units: </span>
                            <span className="font-medium">{cost.compute_units.toFixed(4)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration: </span>
                            <span className="font-medium">{cost.run_duration_seconds}s</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Items Scraped: </span>
                            <span className="font-medium">{cost.items_scraped}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost: </span>
                            <span className="font-semibold text-primary">{formatCurrency(cost.cost_usd)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

