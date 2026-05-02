"use client";

import { useState } from "react";
import { Brain, Search as SearchIcon, List } from "lucide-react";
import { cn } from "@/lib/utils";
import EntityAnalyze from "./analyze";
import EntityResults from "./results";
import EntitySearch from "./search";
import AllEntityResults from "./all-result";

type TabType = "analyze" | "results" | "search" | "all";

export default function EntitySentiment() {
	const [activeTab, setActiveTab] = useState<TabType>("analyze");

	const tabs = [
		{ id: "analyze" as TabType, label: "Analyze", icon: Brain },
		{ id: "results" as TabType, label: "Results", icon: SearchIcon },
		{ id: "all" as TabType, label: "All Results", icon: List },
		{ id: "search" as TabType, label: "Search", icon: List },
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
				{activeTab === "analyze" && <EntityAnalyze />}
				{activeTab === "results" && <EntityResults />}
				{activeTab === "all" && <AllEntityResults />}
				{activeTab === "search" && <EntitySearch />}
			</div>
		</div>
	);
}
