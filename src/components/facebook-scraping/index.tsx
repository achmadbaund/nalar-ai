"use client";

import { useState } from "react";
import { Users, FileText, ClipboardList, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import AccountsTab from "./accounts-tab";
import PostsTab from "./posts-tab";
import JobsTab from "./jobs-tab";
import StatisticsTab from "./statistics-tab";
import ServiceHealthIndicator from "@/components/service-health-indicator";

type TabType = "accounts" | "posts" | "jobs" | "statistics";

export default function FacebookScraping() {
  const [activeTab, setActiveTab] = useState<TabType>("accounts");

  const tabs = [
    { id: "accounts" as TabType, label: "Accounts", icon: Users },
    { id: "posts" as TabType, label: "Posts", icon: FileText },
    { id: "jobs" as TabType, label: "Jobs", icon: ClipboardList },
    { id: "statistics" as TabType, label: "Statistics", icon: BarChart3 },
  ];

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm relative">
      {/* Health Indicator */}
      <ServiceHealthIndicator serviceId="facebook-service" label="Facebook" />
      
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
        {activeTab === "accounts" && <AccountsTab />}
        {activeTab === "posts" && <PostsTab />}
        {activeTab === "jobs" && <JobsTab />}
        {activeTab === "statistics" && <StatisticsTab />}
      </div>
    </div>
  );
}
