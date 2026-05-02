"use client";

import { useState } from "react";
import { Upload, List, Monitor, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import SubmitBatch from "./submit-batch";
import JobsList from "./jobs-list";
import JobMonitor from "./job-monitor";
import HealthCheck from "./health-check";

type TabType = "submit" | "jobs" | "monitor" | "health";

export default function BatchProcessor() {
  const [activeTab, setActiveTab] = useState<TabType>("submit");

  const tabs = [
    { id: "submit" as TabType, label: "Submit Batch", icon: Upload },
    { id: "jobs" as TabType, label: "Jobs List", icon: List },
    { id: "monitor" as TabType, label: "Monitor Job", icon: Monitor },
    { id: "health" as TabType, label: "Health Check", icon: Heart },
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
        {activeTab === "submit" && <SubmitBatch />}
        {activeTab === "jobs" && <JobsList />}
        {activeTab === "monitor" && <JobMonitor />}
        {activeTab === "health" && <HealthCheck />}
      </div>
    </div>
  );
}

