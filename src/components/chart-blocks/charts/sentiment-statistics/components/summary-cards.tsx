"use client";

import { FileText, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { addThousandsSeparator } from "@/lib/utils";

interface Summary {
  total_posts_analyzed: number;
  date_range: {
    from: string;
    to: string;
  };
  avg_processing_time: number;
  avg_confidence: number;
}

export default function SummaryCards({ summary }: { summary: Summary | null | undefined }) {
  if (!summary) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString || "-";
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 laptop:grid-cols-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Total Posts</span>
        </div>
        <div className="text-2xl font-semibold">
          {addThousandsSeparator(summary.total_posts_analyzed || 0)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {summary.date_range?.from && summary.date_range?.to
            ? `${formatDate(summary.date_range.from)} - ${formatDate(summary.date_range.to)}`
            : "-"}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Avg Processing Time</span>
        </div>
        <div className="text-2xl font-semibold">
          {(summary.avg_processing_time || 0).toFixed(3)}s
        </div>
        <div className="text-xs text-muted-foreground mt-1">Per post</div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Avg Confidence</span>
        </div>
        <div className="text-2xl font-semibold">
          {((summary.avg_confidence || 0) * 100).toFixed(1)}%
        </div>
        <div className="text-xs text-muted-foreground mt-1">Confidence score</div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Date Range</span>
        </div>
        <div className="text-sm font-medium">
          {summary.date_range?.from ? formatDate(summary.date_range.from) : "-"}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          to {summary.date_range?.to ? formatDate(summary.date_range.to) : "-"}
        </div>
      </div>
    </div>
  );
}

