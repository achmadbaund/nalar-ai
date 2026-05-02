"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthResponse {
  status: string;
  database?: string;
  service?: string;
  version?: string;
}

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/batch-processor/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Health check gagal");
      }

      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal melakukan health check");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  const isHealthy = health?.status === "healthy";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Service Health Status</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={checkHealth}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Check Health
        </Button>
      </div>

      {loading && !health && (
        <div className="flex min-h-32 items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memeriksa health status...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {health && (
        <div className={`rounded-lg border p-6 ${
          isHealthy
            ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
            : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {isHealthy ? (
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            )}
            <div>
              <h4 className="text-lg font-semibold">
                {isHealthy ? "Service Healthy" : "Service Unhealthy"}
              </h4>
              <p className="text-sm text-muted-foreground">
                Status: <span className="font-medium capitalize">{health.status}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {health.service && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Service</div>
                <div className="text-sm font-medium">{health.service}</div>
              </div>
            )}
            {health.version && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Version</div>
                <div className="text-sm font-medium">{health.version}</div>
              </div>
            )}
            {health.database && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Database</div>
                <div className="text-sm font-medium capitalize">{health.database}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {!health && !loading && !error && (
        <div className="flex min-h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Klik "Check Health" untuk memeriksa status service
          </p>
        </div>
      )}
    </div>
  );
}

