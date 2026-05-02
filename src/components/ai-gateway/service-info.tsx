"use client";

import { useEffect, useState } from "react";
import { Info, CheckCircle2, XCircle, Loader2, Activity } from "lucide-react";
import type { ServiceInfo, HealthCheck } from "./types";

export default function ServiceInfo() {
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null);
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch service info
      const infoResponse = await fetch("/api/ai-gateway/service");
      if (!infoResponse.ok) {
        throw new Error("Failed to fetch service info");
      }
      const infoData: ServiceInfo = await infoResponse.json();
      setServiceInfo(infoData);

      // Fetch health check
      const healthResponse = await fetch("/api/ai-gateway/health");
      if (healthResponse.ok) {
        const healthData: HealthCheck = await healthResponse.json();
        setHealthCheck(healthData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setServiceInfo(null);
      setHealthCheck(null);
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

  const endpoints = [
    { name: "Sentiment Analysis", path: "POST /api/v1/sentiment/analyze", color: "pink" },
    { name: "Aspect Analysis", path: "POST /api/v1/aspect/analyze", color: "purple" },
    { name: "Entity Extraction", path: "POST /api/v1/entity/analyze", color: "orange" },
    { name: "Emotion Detection", path: "POST /api/v1/emotion/analyze", color: "red" },
    { name: "Topic Classification", path: "POST /api/v1/topic/analyze", color: "green" },
    { name: "Trend Analysis", path: "GET /api/v1/trend/analyze", color: "blue" },
    { name: "Batch Processing", path: "POST /api/v1/batch/submit", color: "cyan" },
    { name: "Health Check", path: "GET /api/v1/health", color: "gray" },
  ];

  const colorClasses: Record<string, string> = {
    pink: "bg-pink-500/10 text-pink-500",
    purple: "bg-purple-500/10 text-purple-500",
    orange: "bg-orange-500/10 text-orange-500",
    red: "bg-red-500/10 text-red-500",
    green: "bg-green-500/10 text-green-500",
    blue: "bg-blue-500/10 text-blue-500",
    cyan: "bg-cyan-500/10 text-cyan-500",
    gray: "bg-gray-500/10 text-gray-500",
  };

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
            <p className="text-sm text-muted-foreground">AI Gateway Service Details</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 phone:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Service Name</p>
            <p className="mt-1 text-xl font-semibold">{serviceInfo?.service || "N/A"}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Version</p>
            <p className="mt-1 text-xl font-semibold">{serviceInfo?.version || "N/A"}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Port</p>
            <p className="mt-1 text-xl font-semibold">{serviceInfo?.port || "N/A"}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-1 flex items-center gap-2">
              {serviceInfo?.status === "running" ? (
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

      {/* Health Check */}
      {healthCheck && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-500/10 p-3">
              <Activity className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Health Check</h3>
              <p className="text-sm text-muted-foreground">Service Dependencies Status</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 phone:grid-cols-3">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Database</p>
                  <p className="mt-1 text-lg font-semibold capitalize">
                    {healthCheck.checks?.database || "N/A"}
                  </p>
                </div>
                {healthCheck.checks?.database === "healthy" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Redis</p>
                  <p className="mt-1 text-lg font-semibold capitalize">
                    {healthCheck.checks?.redis || "N/A"}
                  </p>
                </div>
                {healthCheck.checks?.redis === "healthy" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall</p>
                  <p className="mt-1 text-lg font-semibold capitalize">
                    {healthCheck.status || "N/A"}
                  </p>
                </div>
                {healthCheck.status === "healthy" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Endpoints */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Available API Endpoints</h3>
        <div className="mt-4 space-y-3">
          {endpoints.map((endpoint) => (
            <div key={endpoint.name} className="flex items-center justify-between rounded-md bg-muted/20 p-3">
              <div>
                <p className="font-medium">{endpoint.name}</p>
                <p className="text-sm text-muted-foreground">{endpoint.path}</p>
              </div>
              <span
                className={`rounded-md px-3 py-1 text-xs font-medium ${
                  endpoint.path.startsWith("GET")
                    ? "bg-blue-500/10 text-blue-500"
                    : endpoint.path.startsWith("POST")
                    ? colorClasses[endpoint.color]
                    : "bg-gray-500/10 text-gray-500"
                }`}
              >
                {endpoint.path.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
