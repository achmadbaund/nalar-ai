"use client";

import { useState } from "react";
import {
  Network,
  Info,
  Smile,
  Sparkles,
  Tag,
  Heart,
  Hash,
  Layers,
  TrendingUp,
} from "lucide-react";
import ServiceInfo from "./service-info";
import SentimentAnalyze from "./sentiment-analyze";
import AspectAnalyze from "./aspect-analyze";
import EntityAnalyze from "./entity-analyze";
import EmotionAnalyze from "./emotion-analyze";
import TopicAnalyze from "./topic-analyze";
import TrendAnalyze from "./trend-analyze";
import BatchProcessing from "./batch-processing";

const tabs = [
  { id: "service-info", label: "Service Info", icon: Info },
  { id: "sentiment-analyze", label: "Sentiment", icon: Smile },
  { id: "aspect-analyze", label: "Aspect", icon: Sparkles },
  { id: "entity-analyze", label: "Entity", icon: Tag },
  { id: "emotion-analyze", label: "Emotion", icon: Heart },
  { id: "topic-analyze", label: "Topic", icon: Hash },
  { id: "trend-analyze", label: "Trend", icon: TrendingUp },
  { id: "batch-processing", label: "Batch", icon: Layers },
];

export default function AIGateway() {
  const [activeTab, setActiveTab] = useState("service-info");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">AI Gateway</h2>
        <p className="text-muted-foreground">Unified API gateway for all AI services</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "service-info" && <ServiceInfo />}
        {activeTab === "sentiment-analyze" && <SentimentAnalyze />}
        {activeTab === "aspect-analyze" && <AspectAnalyze />}
        {activeTab === "entity-analyze" && <EntityAnalyze />}
        {activeTab === "emotion-analyze" && <EmotionAnalyze />}
        {activeTab === "topic-analyze" && <TopicAnalyze />}
        {activeTab === "trend-analyze" && <TrendAnalyze />}
        {activeTab === "batch-processing" && <BatchProcessing />}
      </div>
    </div>
  );
}
