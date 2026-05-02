"use client";

import type { ModelStatisticsSummary } from "@/components/model-management/types";

interface ChartProps {
  data: ModelStatisticsSummary | null;
}

const MODEL_TYPE_COLORS = {
  sentiment: "#3B82F6", // Blue
  emotion: "#EC4899", // Pink
  topic: "#10B981", // Green
  aspect: "#F59E0B", // Orange
  entity: "#8B5CF6", // Purple
};

const MODEL_TYPE_LABELS = {
  sentiment: "Sentiment",
  emotion: "Emotion",
  topic: "Topic",
  aspect: "Aspect",
  entity: "Entity",
};

export default function Chart({ data }: ChartProps) {
  if (!data) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
        <p className="text-muted-foreground">No model data available</p>
      </div>
    );
  }

  const modelsByType = data.models_by_type || {};
  const totalModels = Object.values(modelsByType).reduce((sum, count) => sum + count, 0);

  if (totalModels === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
        <p className="text-muted-foreground">No models registered yet</p>
      </div>
    );
  }

  // Calculate doughnut chart segments
  let currentAngle = 0;
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  const strokeWidth = 30;
  const circumference = 2 * Math.PI * ((radius + strokeWidth / 2) / 100 * 100);

  const segments = Object.entries(modelsByType).map(([type, count], index) => {
    const percentage = (count / totalModels) * 100;
    const angle = (count / totalModels) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate SVG arc path
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    // For doughnut, we need to calculate inner and outer radius
    const outerRadius = 45;
    const innerRadius = 25;

    const outerX1 = centerX + outerRadius * Math.cos(startRad);
    const outerY1 = centerY + outerRadius * Math.sin(startRad);
    const outerX2 = centerX + outerRadius * Math.cos(endRad);
    const outerY2 = centerY + outerRadius * Math.sin(endRad);

    const innerX1 = centerX + innerRadius * Math.cos(startRad);
    const innerY1 = centerY + innerRadius * Math.sin(startRad);
    const innerX2 = centerX + innerRadius * Math.cos(endRad);
    const innerY2 = centerY + innerRadius * Math.sin(endRad);

    const pathD = `
      M ${outerX1} ${outerY1}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}
      L ${innerX2} ${innerY2}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}
      Z
    `;

    return {
      type,
      count,
      percentage,
      pathD,
      color: MODEL_TYPE_COLORS[type as keyof typeof MODEL_TYPE_COLORS] || "#6B7280",
      label: MODEL_TYPE_LABELS[type as keyof typeof MODEL_TYPE_LABELS] || type,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Models by Type</h3>
        <div className="text-sm text-muted-foreground">Total: {totalModels}</div>
      </div>

      <div className="relative h-[250px] w-full">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          {segments.map((segment, index) => (
            <g key={index}>
              <path
                d={segment.pathD}
                fill={segment.color}
                opacity="0.9"
                className="transition-opacity hover:opacity-100"
              />
            </g>
          ))}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold">{totalModels}</p>
            <p className="text-sm text-muted-foreground">Models</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="font-medium">({segment.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
