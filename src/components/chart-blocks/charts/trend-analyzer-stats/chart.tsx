"use client";

import { TrendResult } from "@/components/trend-analyzer/types";

interface ChartProps {
  data: TrendResult[];
}

export default function Chart({ data }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
        <p className="text-muted-foreground">No trend data available</p>
      </div>
    );
  }

  // Sort data by date
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const maxScore = Math.max(...sortedData.map((d) => d.avg_sentiment_score));
  const minScore = Math.min(...sortedData.map((d) => d.avg_sentiment_score));
  const range = maxScore - minScore || 1;

  // Calculate SVG path
  const width = 300;
  const height = 100;
  const padding = 5;

  const points = sortedData.map((d, i) => {
    const x = padding + (i / (sortedData.length - 1 || 1)) * (width - 2 * padding);
    const y =
      padding +
      ((maxScore - d.avg_sentiment_score) / range) * (height - 2 * padding);
    return { x, y, data: d };
  });

  const pathD =
    points.length > 0
      ? points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ")
      : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sentiment Trend Over Time</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Sentiment Score</span>
          </div>
          {sortedData.filter((d) => d.has_spike).length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Spike</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative h-[300px] w-full rounded-lg border border-border bg-card p-4">
        <svg viewBox="0 0 300 100" className="h-full w-full">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" strokeWidth="0.2" className="text-muted-foreground/30" />
          <line x1={padding} y1={50} x2={width - padding} y2={50} stroke="currentColor" strokeWidth="0.2" className="text-muted-foreground/30" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeWidth="0.2" className="text-muted-foreground/30" />

          {/* Area fill */}
          {pathD && (
            <path
              d={`${pathD} L ${points[points.length - 1]?.x || padding} ${height - padding} L ${padding} ${height - padding} Z`}
              fill="url(#gradient)"
              opacity="0.2"
            />
          )}

          {/* Line */}
          {pathD && <path d={pathD} fill="none" stroke="url(#lineGradient)" strokeWidth="1" />}

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              {/* Spike indicator */}
              {point.data.has_spike && (
                <circle cx={point.x} cy={point.y} r="2.5" fill="#f97316" opacity="0.3" />
              )}
              {/* Main point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={point.data.has_spike ? "1.5" : "1"}
                fill={point.data.has_spike ? "#f97316" : "#3b82f6"}
              />
            </g>
          ))}

          {/* Gradients */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Date labels */}
        <div className="absolute bottom-2 left-4 right-4 flex justify-between text-xs text-muted-foreground">
          <span>{sortedData[0]?.date}</span>
          <span>{sortedData[sortedData.length - 1]?.date}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Normal Trend</span>
        </div>
        {sortedData.filter((d) => d.has_spike).length > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Spike Detected</span>
          </div>
        )}
        <div className="ml-auto text-muted-foreground">
          {sortedData.length} data points
        </div>
      </div>
    </div>
  );
}
