"use client";

import { useState } from "react";
import { Brain, Layers, Search, List, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import TopicAnalyze from "./analyze";
import TopicBatch from "./batch";
import TopicResults from "./results";
import TopicAllResults from "./all-result";
import TopicTrain from "./train";

type TabType = "analyze" | "batch" | "results" | "all" | "train";

export default function TopicAnalyzer() {
	const [activeTab, setActiveTab] = useState<TabType>("analyze");

	const tabs = [
		{ id: "analyze" as TabType, label: "Analyze", icon: Brain },
		{ id: "batch" as TabType, label: "Batch", icon: Layers },
		{ id: "results" as TabType, label: "Results", icon: Search },
		{ id: "all" as TabType, label: "All Results", icon: List },
		{ id: "train" as TabType, label: "Train", icon: Zap },
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
				{activeTab === "analyze" && <TopicAnalyze />}
				{activeTab === "batch" && <TopicBatch />}
				{activeTab === "results" && <TopicResults />}
				{activeTab === "all" && <TopicAllResults />}
				{activeTab === "train" && <TopicTrain />}
			</div>
		</div>
	);
}
