"use client";

import { useState } from "react";
import { Brain, BarChart3, List, Zap, Layers, Activity, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import PocAnalyze from "./poc-analyze";
import PocStatistics from "./poc-statistics";
import PocPosts from "./poc-posts";
import ProductionAnalyze from "./production-analyze";
import ProductionBatch from "./production-batch";
import ProductionStatistics from "./production-statistics";
import ProductionResults from "./production-results";

type TabType = "poc-analyze" | "poc-statistics" | "poc-posts" | "production-analyze" | "production-batch" | "production-statistics" | "production-results";

export default function SentimentCore() {
  const [activeTab, setActiveTab] = useState<TabType>("production-analyze");

  const tabs = [
    { id: "poc-analyze" as TabType, label: "POC Analyze", icon: Brain },
    { id: "poc-statistics" as TabType, label: "POC Statistics", icon: BarChart3 },
    { id: "poc-posts" as TabType, label: "POC Posts", icon: List },
    { id: "production-analyze" as TabType, label: "Production Analyze", icon: Zap },
    { id: "production-batch" as TabType, label: "Production Batch", icon: Layers },
    { id: "production-statistics" as TabType, label: "Production Statistics", icon: TrendingUp },
    { id: "production-results" as TabType, label: "Production Results", icon: Activity },
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
                    : "text-muted-foreground hover:bg-muted",
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
        {activeTab === "poc-analyze" && <PocAnalyze />}
        {activeTab === "poc-statistics" && <PocStatistics />}
        {activeTab === "poc-posts" && <PocPosts />}
        {activeTab === "production-analyze" && <ProductionAnalyze />}
        {activeTab === "production-batch" && <ProductionBatch />}
        {activeTab === "production-statistics" && <ProductionStatistics />}
        {activeTab === "production-results" && <ProductionResults />}
      </div>
    </div>
  );
}

