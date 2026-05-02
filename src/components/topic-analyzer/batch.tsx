"use client";

import { useState, useEffect } from "react";
import { Layers, Loader2, XCircle, CheckCircle, Tag, Plus, Trash2 } from "lucide-react";
import PostSelector from "@/components/sentiment-core/post-selector";
import { Button } from "@/components/ui/button";

type BatchItem = {
	content_id: number;
	text?: string;
};

type Topic = {
	topic_name: string;
	confidence?: number;
	keywords?: string[];
	description?: string;
};

type BatchResult = {
	content_id: number;
	topics: Topic[];
	status: string;
	error?: string;
};

type BatchResponse = {
	results: BatchResult[];
	total_processed: number;
	processing_time?: number;
};

export default function TopicBatch() {
	const [items, setItems] = useState<BatchItem[]>([
		{ content_id: 0 },
	]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [results, setResults] = useState<BatchResponse | null>(null);
	const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);
	const [isSelectAllMode, setIsSelectAllMode] = useState(false);

	// Add empty item (limit 32)
	const addItem = () => {
		if (items.length >= 32) {
			setError("Maximum 32 items per batch");
			setTimeout(() => setError(null), 3000);
			return;
		}
		setItems([...items, { content_id: 0 }]);
	};

	// Sync selected posts into batch items (like Aspect Sentiment batch)
	useEffect(() => {
		if (isSelectAllMode) return;

		if (selectedPostIds.length > 0) {
			// existing items with content_id > 0 that are not in selectedPostIds
			const existingItems = items.filter((item) => item.content_id > 0 && !selectedPostIds.includes(item.content_id));

			const newItems: BatchItem[] = selectedPostIds.map((postId) => {
				const existing = items.find((it) => it.content_id === postId);
				if (existing) return existing;
				return { content_id: postId };
			});

			const merged = [...existingItems, ...newItems];
			const unique = merged.filter((item, index, self) => index === self.findIndex((t) => t.content_id === item.content_id));
			const limited = unique.slice(0, 32);

			const currentIds = items.filter((item) => item.content_id > 0).map((i) => i.content_id).sort().join(",");
			const newIds = limited.filter((item) => item.content_id > 0).map((i) => i.content_id).sort().join(",");

			if (currentIds !== newIds) {
				setItems(limited.length > 0 ? limited : [{ content_id: 0 }]);
			}
		} else if (items.length === 0 || (items.length === 1 && items[0].content_id === 0)) {
			if (items.length === 0) setItems([{ content_id: 0 }]);
		}
	}, [selectedPostIds, isSelectAllMode]);

	const removeItem = (index: number) => {
		if (items.length === 1) {
			setError("At least one item is required");
			setTimeout(() => setError(null), 3000);
			return;
		}
		const toRemove = items[index];
		setItems(items.filter((_, i) => i !== index));
		if (toRemove.content_id > 0) {
			setSelectedPostIds(selectedPostIds.filter((id) => id !== toRemove.content_id));
		}
	};

	const updateItem = (index: number, field: keyof BatchItem, value: number | string) => {
		const newItems = [...items];
		newItems[index] = { ...newItems[index], [field]: value } as BatchItem;
		setItems(newItems);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setResults(null);
		setLoading(true);

		try {
			let payload: any;

			if (isSelectAllMode) {
				payload = { items: [], process_all: true };
			} else {
				const validItems = items.filter((item) => item.content_id > 0);
				if (validItems.length === 0) throw new Error("At least one valid item with content_id is required");
				if (validItems.length > 32) throw new Error("Maximum 32 items per batch");

				payload = {
					items: validItems.map((item) => {
						if (item.text && item.text.trim().length > 0) {
							return { content_id: item.content_id, text: item.text.trim() };
						}
						return { content_id: item.content_id };
					}),
				};
			}

			const response = await fetch("/api/topic-analyzer/analyze/batch", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await response.json();

			if (!response.ok) {
				if (response.status === 504) {
					throw new Error("Batch analysis timed out. Please try again with fewer items.");
				}
				throw new Error(data.error || "Failed to analyze batch");
			}

			setResults(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	// Normalize results shape for rendering
	const resultItems = Array.isArray((results as any)?.results)
		? (results as any).results
		: Array.isArray(results)
		? (results as any)
		: [];

	const totalProcessed = (results as any)?.total_processed ?? (Array.isArray(results) ? (results as any).length : undefined);

	return (
		<div className="space-y-6">
			{/* Post selector to pick multiple posts for batch */}
			<div className="rounded-lg border border-border bg-card p-4">
				<PostSelector
					selectedPostIds={selectedPostIds}
					onSelectionChange={(ids) => {
						if (isSelectAllMode) setIsSelectAllMode(false);
						setSelectedPostIds(ids.slice(0, 32));
					}}
					maxSelections={32}
					onSelectAll={() => {
						setIsSelectAllMode(!isSelectAllMode);
						setSelectedPostIds([]);
					}}
					isSelectAllMode={isSelectAllMode}
				/>
			</div>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-4">
					{items.map((item, idx) => (
						<div key={idx} className="rounded border border-border p-4 space-y-3">
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-medium">Item #{idx + 1}</h4>
								{items.length > 1 && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => removeItem(idx)}
										disabled={loading}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</div>
							<div className="grid grid-cols-1 gap-3">
								<input
									type="number"
									value={item.content_id > 0 ? item.content_id : ""}
									onChange={(e) => {
										const value = e.target.value;
										const newContentId = value === "" ? 0 : parseInt(value) || 0;
										const oldContentId = item.content_id;
										updateItem(idx, "content_id", newContentId);
										if (newContentId > 0 && !selectedPostIds.includes(newContentId)) {
											setSelectedPostIds([...selectedPostIds, newContentId]);
										}
										if (oldContentId > 0 && oldContentId !== newContentId) {
											setSelectedPostIds(selectedPostIds.filter((id) => id !== oldContentId));
										}
									}}
									placeholder="Enter content ID"
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									disabled={loading}
								/>
								<textarea
									value={item.text}
									onChange={(e) => updateItem(idx, "text", e.target.value)}
									placeholder="Article text..."
									rows={4}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
									disabled={loading}
								/>
							</div>
						</div>
					))}
				</div>

				<div className="flex gap-2">
					<Button type="button" variant="outline" onClick={addItem} disabled={loading} className="flex-1">
						<Plus className="h-4 w-4 mr-2" /> Add Item
					</Button>
					<Button type="submit" disabled={loading} className="flex-1">
						{loading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...
							</>
						) : (
							<>
								<Layers className="h-4 w-4 mr-2" /> Analyze Batch
							</>
						)}
					</Button>
				</div>
			</form>

			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
					<div className="flex items-center gap-2">
						<XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
						<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
					</div>
				</div>
			)}

			{results && (
				<div className="space-y-4">
					<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
						<div className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
							<p className="text-sm text-green-600 dark:text-green-400">
								Batch complete! Processed {totalProcessed ?? "-"} item{(totalProcessed ?? 0) === 1 ? "" : "s"}
								{results?.processing_time && typeof results.processing_time === 'number' && ` in ${results.processing_time.toFixed(2)}s`}
							</p>
						</div>
					</div>

					<div className="space-y-4">
						{resultItems.map((result: any, idx: number) => {
							const topics: Topic[] = Array.isArray(result?.topics) ? result.topics : [];
							return (
								<div key={idx} className="rounded border border-border p-4 space-y-3">
									<div className="flex items-center justify-between">
										<h4 className="font-medium text-sm">Content ID: {result.content_id}</h4>
										<span
											className={`text-xs px-2 py-1 rounded ${
												result.status === "success"
													? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
													: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
											}`}
										>
											{result.status}
										</span>
									</div>

									{result.error ? (
										<p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
									) : (
										<>
											{topics.length === 0 ? (
												<p className="text-sm text-muted-foreground">No topics detected</p>
											) : (
												<div className="space-y-2">
													{topics.map((topic: Topic, tidx: number) => (
														<div key={tidx} className="rounded bg-muted p-3 space-y-1">
															<div className="flex items-start justify-between gap-4">
																<div className="flex items-center gap-2">
																	<Tag className="h-3 w-3" />
																	<span className="font-medium text-sm">{topic.topic_name}</span>
																</div>
																{typeof topic.confidence === "number" && (
																	<span className="text-xs text-muted-foreground">
																		{(topic.confidence * 100).toFixed(1)}%
																	</span>
																)}
															</div>
															{topic.keywords && topic.keywords.length > 0 && (
																<div className="flex flex-wrap gap-1 mt-1">
																	{topic.keywords.map((kw: string, kidx: number) => (
																		<span key={kidx} className="text-xs bg-background px-1.5 py-0.5 rounded">
																			{kw}
																		</span>
																	))}
																</div>
															)}
														</div>
													))}
												</div>
											)}
										</>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
