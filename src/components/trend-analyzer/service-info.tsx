"use client";

import { useEffect, useState } from "react";
import { Info, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { ServiceInfo, HealthCheck } from "./types";

export default function ServiceInfo() {
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch service info from root endpoint
      const infoResponse = await fetch("/api/trend-analyzer/service");
      if (!infoResponse.ok) {
        throw new Error("Failed to fetch service info");
      }
      const infoData: ServiceInfo = await infoResponse.json();
      setServiceInfo(infoData);

      // Map status to health check format
      setHealth({ status: infoData.status === "running" ? "healthy" : infoData.status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setServiceInfo(null);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-4 text-destructive font-medium">Error loading service info</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Information */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Info className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Service Information</h3>
            <p className="text-sm text-muted-foreground">Trend Analyzer Service Details</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 phone:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Service Name</p>
            <p className="mt-1 text-xl font-semibold">{serviceInfo?.service || "N/A"}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Version</p>
            <p className="mt-1 text-xl font-semibold">{serviceInfo?.version || "N/A"}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-1 flex items-center gap-2">
              {serviceInfo?.status === "running" || health?.status === "healthy" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-xl font-semibold text-green-500">Running</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-xl font-semibold text-red-500">Down</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Available API Endpoints</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          All endpoints are prefixed with the Trend Analyzer service URL
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-md bg-muted/20 p-3">
            <div>
              <p className="font-medium">Health Check</p>
              <p className="text-xs text-muted-foreground">GET /health</p>
            </div>
            <span className="rounded-md bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
              GET
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted/20 p-3">
            <div>
              <p className="font-medium">Analyze Single Date Trend</p>
              <p className="text-xs text-muted-foreground">GET /api/v1/trend/analyze?granularity=single</p>
            </div>
            <span className="rounded-md bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
              GET
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted/20 p-3">
            <div>
              <p className="font-medium">Analyze Daily Time Series</p>
              <p className="text-xs text-muted-foreground">GET /api/v1/trend/analyze?granularity=daily</p>
            </div>
            <span className="rounded-md bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
              GET
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted/20 p-3">
            <div>
              <p className="font-medium">Get Trend Results</p>
              <p className="text-xs text-muted-foreground">GET /api/v1/trend/results</p>
            </div>
            <span className="rounded-md bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
              GET
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted/20 p-3">
            <div>
              <p className="font-medium">Predict Content Virality</p>
              <p className="text-xs text-muted-foreground">POST /api/v1/trend/virality/predict</p>
            </div>
            <span className="rounded-md bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-500">
              POST
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-muted/20 p-3">
            <div>
              <p className="font-medium">Aggregate Sentiment Data</p>
              <p className="text-xs text-muted-foreground">POST /api/v1/trend/aggregate</p>
            </div>
            <span className="rounded-md bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-500">
              POST
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
