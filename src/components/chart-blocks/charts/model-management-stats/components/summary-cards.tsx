"use client";

import { Database, HardDrive, CheckCircle, Clock } from "lucide-react";

interface SummaryCardsProps {
  totalModels: number;
  activeModels: number;
  totalStorage: number;
}

export default function SummaryCards({
  totalModels,
  activeModels,
  totalStorage,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Models",
      value: totalModels.toLocaleString(),
      icon: <Database className="h-4 w-4" />,
      color: "text-purple-500",
    },
    {
      title: "Active Models",
      value: activeModels.toLocaleString(),
      icon: <CheckCircle className="h-4 w-4" />,
      color: "text-green-500",
    },
    {
      title: "Total Storage",
      value: `${totalStorage.toFixed(2)} MB`,
      icon: <HardDrive className="h-4 w-4" />,
      color: "text-blue-500",
    },
    {
      title: "Inactive",
      value: (totalModels - activeModels).toLocaleString(),
      icon: <Clock className="h-4 w-4" />,
      color: "text-gray-500",
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
