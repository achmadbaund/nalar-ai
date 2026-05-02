"use client";

import { useState } from "react";
import { Search, Loader2, XCircle, Users, Building, MapPin, Check, X, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type Entity = {
	entity_name: string;
	entity_type: string;
	source?: string;
	sentiment_label?: string;
	sentiment_score?: number;
	mention_count?: number;
	context_sentences?: string[];
	id?: number;
};

type ResultsResponse = {
	content_id: number;
	results: Entity[];
	created_at?: string;
};

export default function EntityResults() {
	const [contentId, setContentId] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<ResultsResponse | null>(null);
	const [expandedIds, setExpandedIds] = useState<Set<number | string>>(new Set());

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setData(null);
		setLoading(true);

		try {
			if (!contentId.trim()) throw new Error("Content ID is required");

			const response = await fetch(`/api/entity-sentiment/results/${contentId.trim()}`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});

			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Failed to load results");

			setData(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	const toggleExpand = (id: number | string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const groupedResults = data?.results.reduce((acc, entity) => {
		const type = (entity.entity_type || "UNKNOWN").toUpperCase();
		if (!acc[type]) acc[type] = [];
		acc[type].push(entity);
		return acc;
	}, {} as Record<string, Entity[]>);

	const renderEntityList = (entities: Entity[]) => (
		<div className="rounded border border-border p-3 space-y-1">
			{entities.map((entity) => {
				const label = entity.sentiment_label ? entity.sentiment_label.toUpperCase() : "-";
				const score = typeof entity.sentiment_score === "number" ? entity.sentiment_score.toFixed(2) : null;
				const mentions = entity.mention_count ?? 0;
				const entityId = entity.id ?? `${entity.entity_name}-${Math.random()}`;
				const isExpanded = expandedIds.has(entityId);

				// Icon + color by sentiment
				let SentimentIcon: any = Circle;
				let iconClass = "text-slate-400";
				switch (label) {
					case "POSITIVE":
						SentimentIcon = Check;
						iconClass = "text-emerald-600";
						break;
					case "NEGATIVE":
						SentimentIcon = X;
						iconClass = "text-rose-600";
						break;
					default:
						SentimentIcon = Circle;
						iconClass = "text-slate-400";
				}

				return (
					<div key={entityId} className="border-b last:border-b-0 py-2">
						<div className="flex items-center justify-between text-sm">
							<div className="flex items-center gap-3 min-w-0">
								<SentimentIcon className={`h-4 w-4 flex-shrink-0 ${iconClass}`} />
								<div className="truncate max-w-[40rem] font-medium">{entity.entity_name}</div>
								{entity.source && (
									<span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
										{entity.source}
									</span>
								)}
							</div>
							<div className="flex items-center gap-6">
								<div className="text-sm text-muted-foreground flex items-center gap-2">
									<span className="font-medium">{label}</span>
									{score && <span>({score})</span>}
								</div>
								<div className="text-sm text-muted-foreground">
									{mentions} mention{mentions === 1 ? "" : "s"}
								</div>
								{entity.context_sentences && entity.context_sentences.length > 0 && (
									<button
										onClick={() => toggleExpand(entityId)}
										className="text-xs text-primary hover:underline flex items-center gap-1"
									>
										{isExpanded ? (
											<>
												<ChevronUp className="h-3 w-3" /> Hide
											</>
										) : (
											<>
												<ChevronDown className="h-3 w-3" /> Context
											</>
										)}
									</button>
								)}
							</div>
						</div>

						{isExpanded && entity.context_sentences && (
							<div className="mt-2 ml-7 text-xs text-muted-foreground space-y-1 bg-muted p-2 rounded">
								{entity.context_sentences.map((sentence, idx) => (
									<p key={idx}>• {sentence}</p>
								))}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);

	return (
		<div className="space-y-6">
			<form onSubmit={handleSubmit} className="flex gap-2">
				<input
					type="number"
					value={contentId}
					onChange={(e) => setContentId(e.target.value)}
					placeholder="Content ID"
					className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
					disabled={loading}
				/>
				<Button type="submit" disabled={loading}>
					{loading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
						</>
					) : (
						<>
							<Search className="h-4 w-4 mr-2" /> Load Results
						</>
					)}
				</Button>
			</form>

			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
					<div className="flex items-center gap-2">
						<XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
						<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
					</div>
				</div>
			)}

			{data && (
				<>
					{data.created_at && (
						<div className="text-xs text-muted-foreground">
							Analyzed at: {new Date(data.created_at).toLocaleString()}
						</div>
					)}

					{data.results.length === 0 ? (
						<div className="text-center py-8 text-sm text-muted-foreground">
							<p>No saved results found for content ID {data.content_id}.</p>
							<p className="mt-2">Try running a fresh analysis first.</p>
						</div>
					) : (
						<div className="space-y-6">
							{/* PEOPLE */}
							{groupedResults?.["PERSON"] && (
								<div>
									<div className="flex items-center gap-2 mb-3 text-sm font-medium">
										<Users className="h-4 w-4" /> PEOPLE
									</div>
									{renderEntityList(groupedResults["PERSON"])}
								</div>
							)}

							{/* ORGANIZATIONS */}
							{groupedResults?.["ORGANIZATION"] && (
								<div>
									<div className="flex items-center gap-2 mb-3 text-sm font-medium">
										<Building className="h-4 w-4" /> ORGANIZATIONS
									</div>
									{renderEntityList(groupedResults["ORGANIZATION"])}
								</div>
							)}

							{/* LOCATIONS */}
							{(groupedResults?.["LOCATION"] || groupedResults?.["GPE"]) && (
								<div>
									<div className="flex items-center gap-2 mb-3 text-sm font-medium">
										<MapPin className="h-4 w-4" /> LOCATIONS
									</div>
									{renderEntityList([
										...(groupedResults["LOCATION"] || []),
										...(groupedResults["GPE"] || []),
									])}
								</div>
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
}
