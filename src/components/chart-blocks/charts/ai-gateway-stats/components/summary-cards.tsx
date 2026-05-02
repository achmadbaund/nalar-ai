"use client";

interface SummaryCardsProps {
  totalRequests: number;
  activeServices: number;
  cacheHitRate: number;
  avgResponseTime: number;
}

export default function SummaryCards({
  totalRequests,
  activeServices,
  cacheHitRate,
  avgResponseTime,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 laptop:grid-cols-4">
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">Total Requests</p>
        <p className="mt-1 text-2xl font-semibold">{totalRequests.toLocaleString()}</p>
      </div>
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">Active Services</p>
        <p className="mt-1 text-2xl font-semibold">{activeServices}</p>
      </div>
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
        <p className="mt-1 text-2xl font-semibold">{cacheHitRate.toFixed(1)}%</p>
      </div>
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">Avg Response Time</p>
        <p className="mt-1 text-2xl font-semibold">{avgResponseTime.toFixed(0)}ms</p>
      </div>
    </div>
  );
}
