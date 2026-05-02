"use client";

import { useState } from "react";
import { Brain, Layers, List } from "lucide-react";
import { cn } from "@/lib/utils";
import AspectAnalyze from "./analyze";
import AspectBatch from "./batch";
import AllAspectResults from "./all-results";

type TabType = "analyze" | "batch" | "all-results";

export default function AspectSentiment() {
  const [activeTab, setActiveTab] = useState<TabType>("analyze");

  const tabs = [
    { id: "analyze" as TabType, label: "Analyze", icon: Brain },
    { id: "batch" as TabType, label: "Batch", icon: Layers },
    { id: "all-results" as TabType, label: "All Results", icon: List },
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
        {activeTab === "analyze" && <AspectAnalyze />}
        {activeTab === "batch" && <AspectBatch />}
        {activeTab === "all-results" && <AllAspectResults />}
      </div>
    </div>
  );
}

