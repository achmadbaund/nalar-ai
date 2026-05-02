"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthResponse {
  status?: string;
  service?: string;
  version?: string;
}

export type ServiceHealthIndicatorProps = {
  /** Kunci `SERVICE_URLS` di `/api/health/[serviceId]` */
  serviceId: string;
  /** Label singkat di badge */
  label: string;
};

export default function ServiceHealthIndicator({
  serviceId,
  label,
}: ServiceHealthIndicatorProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/health/${serviceId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Health check failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check health");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const isHealthy = health?.status === "ok" || health?.status === "healthy";
  const isUnhealthy = health?.status === "unhealthy" || error !== null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs shadow-sm transition-colors",
          loading
            ? "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
            : isHealthy
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
              : isUnhealthy
                ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
        )}
        title={
          loading
            ? "Memeriksa health…"
            : isHealthy
              ? `Layanan sehat${health?.service ? ` — ${health.service}` : ""}${health?.version ? ` (v${health.version})` : ""}`
              : isUnhealthy
                ? `Layanan bermasalah${error ? ` — ${error}` : ""}`
                : `Status: ${health?.status || "Tidak diketahui"}`
        }
      >
        {loading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
            <span className="text-gray-500">…</span>
          </>
        ) : isHealthy ? (
          <>
            <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-700 dark:text-green-300">
              {label}
            </span>
            <span className="text-green-600 dark:text-green-400">OK</span>
          </>
        ) : isUnhealthy ? (
          <>
            <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
            <span className="font-medium text-red-700 dark:text-red-300">
              {label}
            </span>
            <span className="text-red-600 dark:text-red-400">Gagal</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium text-yellow-700 dark:text-yellow-300">
              {label}
            </span>
            <span className="text-yellow-600 dark:text-yellow-400">
              {health?.status || "?"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
