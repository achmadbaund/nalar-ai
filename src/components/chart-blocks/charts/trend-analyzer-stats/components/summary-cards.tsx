"use client";

import { TrendingUp, Activity, BarChart3, AlertTriangle } from "lucide-react";

interface SummaryCardsProps {
  totalTrends: number;
  totalSpikes: number;
  avgSentiment: number;
  mostCommonTrend: string;
}

export default function SummaryCards({
  totalTrends,
  totalSpikes,
  avgSentiment,
  mostCommonTrend,
}: SummaryCardsProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case "upward":
        return <TrendingUp className="h-4 w-4" />;
      case "downward":
        return <Activity className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend.toLowerCase()) {
      case "upward":
        return "text-green-500";
      case "downward":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const cards = [
    {
      title: "Total Trends",
      value: totalTrends.toLocaleString(),
      icon: <BarChart3 className="h-4 w-4" />,
      color: "text-blue-500",
    },
    {
      title: "Spikes Detected",
      value: totalSpikes.toLocaleString(),
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-orange-500",
    },
    {
      title: "Avg Sentiment",
      value: avgSentiment.toFixed(2),
      icon: <Activity className="h-4 w-4" />,
      color: avgSentiment > 0.5 ? "text-green-500" : "text-red-500",
    },
    {
      title: "Most Common Trend",
      value: mostCommonTrend.charAt(0).toUpperCase() + mostCommonTrend.slice(1),
      icon: getTrendIcon(mostCommonTrend),
      color: getTrendColor(mostCommonTrend),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 phone:grid-cols-2 laptop:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="rounded-lg border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="mt-1 text-2xl font-semibold">{card.value}</p>
            </div>
            <div className={card.color}>{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
