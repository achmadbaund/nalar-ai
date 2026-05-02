"use client";

import { useState } from "react";
import { FileText, Newspaper, Scan } from "lucide-react";
import { cn } from "@/lib/utils";
import ProcessingLogsTab from "./processing-logs-tab";
import ArticlesTab from "./articles-tab";
import SourcesTab from "./sources-tab";
import ServiceHealthIndicator from "@/components/service-health-indicator";

type TabType = "logs" | "articles" | "sources";

export default function PrintMediaOcr() {
  const [activeTab, setActiveTab] = useState<TabType>("sources");

  const tabs = [
    { id: "logs" as TabType, label: "OCR Processing Logs", icon: FileText },
    { id: "articles" as TabType, label: "Print Media Articles", icon: Newspaper },
    { id: "sources" as TabType, label: "Print Media Sources", icon: Scan },
  ];

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm relative">
      {/* Health Indicator */}
      <ServiceHealthIndicator serviceId="print-media-ocr" label="OCR" />
      
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
        {activeTab === "logs" && <ProcessingLogsTab />}
        {activeTab === "articles" && <ArticlesTab />}
        {activeTab === "sources" && <SourcesTab />}
      </div>
    </div>
  );
}



