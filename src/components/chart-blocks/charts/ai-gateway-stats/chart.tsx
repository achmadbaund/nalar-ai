"use client";

interface ChartProps {
  data: {
    requests_by_service: {
      sentiment: number;
      aspect: number;
      entity: number;
      emotion: number;
      topic: number;
      trend: number;
    };
  } | null;
}

const SERVICE_COLORS = {
  sentiment: "#EC4899", // Pink
  aspect: "#8B5CF6", // Purple
  entity: "#F59E0B", // Orange
  emotion: "#EF4444", // Red
  topic: "#10B981", // Green
  trend: "#3B82F6", // Blue
};

const SERVICE_LABELS = {
  sentiment: "Sentiment",
  aspect: "Aspect",
  entity: "Entity",
  emotion: "Emotion",
  topic: "Topic",
  trend: "Trend",
};

export default function Chart({ data }: ChartProps) {
  if (!data) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-muted/20">
        <p className="text-muted-foreground">No statistics data available</p>
      </div>
    );
  }

  const requestsByService = data.requests_by_service;
  const maxRequests = Math.max(...Object.values(requestsByService));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Requests by Service</h3>
      </div>

      <div className="space-y-4">
        {Object.entries(requestsByService).map(([service, count]) => (
          <div key={service} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {SERVICE_LABELS[service as keyof typeof SERVICE_LABELS]}
              </span>
              <span className="font-medium">{count.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(count / maxRequests) * 100}%`,
                  backgroundColor: SERVICE_COLORS[service as keyof typeof SERVICE_COLORS],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
