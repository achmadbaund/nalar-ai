"use client";

import { useState, useEffect, useCallback } from "react";
import { Search as SearchIcon, Loader2, XCircle, Check, X, Circle } from "lucide-react";

type Entity = {
	entity_name: string;
	entity_type: string;
	source?: string;
	sentiment_label?: string;
	sentiment_score?: number;
	mention_count?: number;
	context_sentences?: string[];
	id?: number;
	content_id?: number;
};

type SearchResponse = {
	query: string;
	results: Entity[];
	total: number;
};

export default function EntitySearch() {
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [results, setResults] = useState<SearchResponse | null>(null);
	const [debouncedQuery, setDebouncedQuery] = useState("");

	// Debounce query input
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query);
		}, 350);

		return () => clearTimeout(timer);
	}, [query]);

	// Auto-search when debounced query changes (min 2 chars)
	useEffect(() => {
		if (debouncedQuery.trim().length >= 2) {
			performSearch(debouncedQuery.trim());
		} else {
			setResults(null);
			setError(null);
		}
	}, [debouncedQuery]);

	const performSearch = async (searchQuery: string) => {
		setLoading(true);
		setError(null);

		try {
			const url = new URL("/api/entity-sentiment/search", window.location.origin);
			url.searchParams.set("name", searchQuery);
			url.searchParams.set("limit", "50");

			const response = await fetch(url.toString(), {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Failed to search");

			setResults(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	const getSentimentIcon = (label?: string) => {
		const upper = label?.toUpperCase();
		switch (upper) {
			case "POSITIVE":
				return { Icon: Check, className: "text-emerald-600" };
			case "NEGATIVE":
				return { Icon: X, className: "text-rose-600" };
			default:
				return { Icon: Circle, className: "text-slate-400" };
		}
	};

	return (
		<div className="space-y-6">
			<div className="relative">
				<div className="absolute left-3 top-1/2 -translate-y-1/2">
					<SearchIcon className="h-4 w-4 text-muted-foreground" />
				</div>
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search entities by name (e.g., Jakarta, Jokowi, KPK)..."
					className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm"
				/>
				{loading && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2">
						<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
					</div>
				)}
			</div>

			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
					<div className="flex items-center gap-2">
						<XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
						<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
					</div>
				</div>
			)}

			{!loading && !error && query.trim().length > 0 && query.trim().length < 2 && (
				<div className="text-sm text-muted-foreground text-center py-4">
					Type at least 2 characters to search
				</div>
			)}

			{results && (
				<div className="space-y-4">
					<div className="text-sm text-muted-foreground">
						Found {results.total} result{results.total === 1 ? "" : "s"} for "{results.query}"
					</div>

					{results.results.length === 0 ? (
						<div className="text-center py-8 text-sm text-muted-foreground">
							<p>No entities found matching "{results.query}"</p>
							<p className="mt-2">Try a different search term</p>
						</div>
					) : (
						<div className="rounded border border-border divide-y">
							{results.results.map((entity, idx) => {
								const { Icon, className } = getSentimentIcon(entity.sentiment_label);
								const score =
									typeof entity.sentiment_score === "number" ? entity.sentiment_score.toFixed(2) : null;
								const mentions = entity.mention_count ?? 0;

								return (
									<div key={entity.id ?? idx} className="p-4 hover:bg-muted/50 transition-colors">
										<div className="flex items-start justify-between gap-4">
											<div className="flex items-start gap-3 min-w-0 flex-1">
												<Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${className}`} />
												<div className="min-w-0 flex-1">
													<div className="font-medium text-sm mb-1">{entity.entity_name}</div>
													<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
														<span className="bg-muted px-2 py-0.5 rounded">
															{entity.entity_type}
														</span>
														{entity.source && (
															<span className="bg-muted px-2 py-0.5 rounded">
																{entity.source}
															</span>
														)}
														{entity.content_id && (
															<span className="text-muted-foreground">
																Content #{entity.content_id}
															</span>
														)}
													</div>
												</div>
											</div>
											<div className="flex flex-col items-end gap-1 text-xs">
												{entity.sentiment_label && (
													<div className="font-medium">
														{entity.sentiment_label.toUpperCase()}
														{score && <span className="ml-1">({score})</span>}
													</div>
												)}
												<div className="text-muted-foreground">
													{mentions} mention{mentions === 1 ? "" : "s"}
												</div>
											</div>
										</div>

										{entity.context_sentences && entity.context_sentences.length > 0 && (
											<div className="mt-3 text-xs text-muted-foreground bg-muted p-2 rounded">
												{entity.context_sentences[0]}
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
