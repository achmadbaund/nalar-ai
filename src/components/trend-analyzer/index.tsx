"use client";

import { useState } from "react";
import {
  Info,
  TrendingUp,
  Database,
  Zap,
  BarChart3,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ServiceInfo from "./service-info";
import TrendAnalyze from "./trend-analyze";
import TrendResults from "./trend-results";
import ViralityPredict from "./virality-predict";
import SentimentAggregate from "./sentiment-aggregate";
import TrendStatistics from "./trend-statistics";

type TabType =
  | "service-info"
  | "trend-analyze"
  | "trend-results"
  | "virality-predict"
  | "sentiment-aggregate"
  | "trend-statistics";

export default function TrendAnalyzer() {
  const [activeTab, setActiveTab] = useState<TabType>("service-info");

  const tabs = [
    { id: "service-info" as TabType, label: "Service Info", icon: Info },
    { id: "trend-analyze" as TabType, label: "Analyze", icon: TrendingUp },
    { id: "trend-results" as TabType, label: "Results", icon: Database },
    { id: "virality-predict" as TabType, label: "Virality", icon: Zap },
    {
      id: "sentiment-aggregate" as TabType,
      label: "Aggregate",
      icon: BarChart3,
    },
    { id: "trend-statistics" as TabType, label: "Statistics", icon: PieChart },
  ];

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 p-2 flex-wrap">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "service-info" && <ServiceInfo />}
        {activeTab === "trend-analyze" && <TrendAnalyze />}
        {activeTab === "trend-results" && <TrendResults />}
        {activeTab === "virality-predict" && <ViralityPredict />}
        {activeTab === "sentiment-aggregate" && <SentimentAggregate />}
        {activeTab === "trend-statistics" && <TrendStatistics />}
      </div>
    </div>
  );
}
