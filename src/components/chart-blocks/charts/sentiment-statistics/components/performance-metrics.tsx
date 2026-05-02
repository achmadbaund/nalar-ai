"use client";

import { Gauge, Zap, FileText } from "lucide-react";
import { addThousandsSeparator } from "@/lib/utils";

interface PerformanceMetrics {
  latency_percentiles: {
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  confidence_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  text_length_stats: {
    avg: number;
    min: number;
    max: number;
  };
}

export default function PerformanceMetrics({
  performanceMetrics,
}: {
  performanceMetrics: PerformanceMetrics | null | undefined;
}) {
  if (!performanceMetrics) {
    return null;
  }

  const totalConfidence =
    (performanceMetrics.confidence_distribution?.high || 0) +
    (performanceMetrics.confidence_distribution?.medium || 0) +
    (performanceMetrics.confidence_distribution?.low || 0);

  return (
    <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 laptop:grid-cols-3">
      {/* Latency Percentiles */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Latency Percentiles</h3>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">P50:</span>
            <span className="font-medium">{(performanceMetrics.latency_percentiles?.p50 || 0).toFixed(3)}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">P95:</span>
            <span className="font-medium">{(performanceMetrics.latency_percentiles?.p95 || 0).toFixed(3)}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">P99:</span>
            <span className="font-medium">{(performanceMetrics.latency_percentiles?.p99 || 0).toFixed(3)}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max:</span>
            <span className="font-medium">{(performanceMetrics.latency_percentiles?.max || 0).toFixed(3)}s</span>
          </div>
        </div>
      </div>

      {/* Confidence Distribution */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Confidence Distribution</h3>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">High:</span>
            <span className="font-medium text-green-500">
              {addThousandsSeparator(performanceMetrics.confidence_distribution?.high || 0)} (
              {totalConfidence > 0
                ? (((performanceMetrics.confidence_distribution?.high || 0) / totalConfidence) * 100).toFixed(1)
                : 0}
              %)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Medium:</span>
            <span className="font-medium text-yellow-500">
              {addThousandsSeparator(performanceMetrics.confidence_distribution?.medium || 0)} (
              {totalConfidence > 0
                ? (((performanceMetrics.confidence_distribution?.medium || 0) / totalConfidence) * 100).toFixed(1)
                : 0}
              %)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Low:</span>
            <span className="font-medium text-red-500">
              {addThousandsSeparator(performanceMetrics.confidence_distribution?.low || 0)} (
              {totalConfidence > 0
                ? (((performanceMetrics.confidence_distribution?.low || 0) / totalConfidence) * 100).toFixed(1)
                : 0}
              %)
            </span>
          </div>
        </div>
      </div>

      {/* Text Length Stats */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Text Length Stats</h3>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Average:</span>
            <span className="font-medium">
              {addThousandsSeparator(Math.round(performanceMetrics.text_length_stats?.avg || 0))} chars
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Min:</span>
            <span className="font-medium">
              {addThousandsSeparator(performanceMetrics.text_length_stats?.min || 0)} chars
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max:</span>
            <span className="font-medium">
              {addThousandsSeparator(performanceMetrics.text_length_stats?.max || 0)} chars
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

