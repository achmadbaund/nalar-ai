"use client";

import { useState } from "react";
import { Brain, Loader2, XCircle, CheckCircle, Tag, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContentSelector, { SelectedContent } from "./content-selector";
import HierarchyView from "./hierarchy-view";

type Topic = {
	topic_name: string;
	confidence?: number;
	keywords?: string[];
	description?: string;
};

type AnalyzeResponse = {
	content_id: number;
	content_type: string;
	topics: Topic[];
	hierarchy?: any; // Uses HierarchyView structure
	total_topics: number;
	processing_time?: number;
};

export default function TopicAnalyze() {
	const [contentId, setContentId] = useState("");
	const [text, setText] = useState("");
	const [selectedContent, setSelectedContent] = useState<SelectedContent | null>(null);
	const [contentType, setContentType] = useState<string>("news");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [results, setResults] = useState<AnalyzeResponse | null>(null);

	const handleContentSelect = (content: SelectedContent) => {
		setSelectedContent(content);
		setContentId(content.content_id.toString());
		setText(content.text);
		setContentType(content.type);
		// Clear previous results when selection changes
		setResults(null);
		setError(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setResults(null);
		setLoading(true);

		try {
			if (!contentId.trim()) throw new Error("Content ID is required");
			if (!text.trim()) throw new Error("Text is required");

			const response = await fetch("/api/topic-analyzer/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					content_id: Number(contentId),
					text: text.trim(),
					content_type: contentType,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				if (response.status === 504) {
					throw new Error("Analysis timed out. Please try again.");
				}
				throw new Error(data.error || "Failed to analyze topics");
			}

			setResults(data);

		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-1 gap-4">
					{/* Content selector */}
					<div>
						<ContentSelector
							onSelect={handleContentSelect}
							selectedContent={selectedContent}
						/>
					</div>

					<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
						<div className="flex items-start gap-2">
							<Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
							<div className="text-sm text-blue-800 dark:text-blue-200">
								<p className="font-medium mb-1">Hierarchical Analysis</p>
								<p className="text-xs mb-2">
									The analyzer determines Topics (Level 1), Subtopics (Level 2), and Stories (Level 3).
									Results are saved automatically.
								</p>
								<ul className="list-disc list-inside space-y-1 text-xs">
									<li>
										Content ID and Text are auto-filled from selection.
									</li>
									<li>
										You can manually edit the text before analysis if needed.
									</li>
								</ul>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label htmlFor="contentId" className="block text-sm font-medium mb-2">
								Content ID
							</label>
							<input
								id="contentId"
								type="number"
								value={contentId}
								onChange={(e) => {
									// If the user edits the content ID manually, clear selection state partially
									// but keep type? Or maybe reset to manual defaults.
									// Keeping it simple.
									setContentId(e.target.value);
								}}
								placeholder="Enter content ID"
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								disabled={loading}
							/>
						</div>
						<div>
							<label htmlFor="contentType" className="block text-sm font-medium mb-2">
								Content Type
							</label>
							<select
								id="contentType"
								value={contentType}
								onChange={(e) => setContentType(e.target.value)}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								disabled={loading}
							>
								<option value="news">Online News</option>
								<option value="social_media">Social Media</option>
								<option value="print">Print Media</option>
								<option value="broadcast">Broadcast</option>
							</select>
						</div>
					</div>

					<div>
						<label htmlFor="text" className="block text-sm font-medium mb-2">
							Content Text
						</label>
						<textarea
							id="text"
							value={text}
							onChange={(e) => {
								setText(e.target.value);
							}}
							placeholder="Content text to analyze..."
							rows={8}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
							disabled={loading}
						/>
					</div>
				</div>

				<Button type="submit" disabled={loading} className="w-full">
					{loading ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing...
						</>
					) : (
						<>
							<Brain className="h-4 w-4 mr-2" /> Analyze Topics
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

			{results && (
				<div className="space-y-4">
					<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
						<div className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
							<p className="text-sm text-green-600 dark:text-green-400">
								Analysis complete! Found {results.total_topics} topic{results.total_topics === 1 ? "" : "s"}
							</p>
						</div>
					</div>

					{/* Hierarchical View */}
					{results.hierarchy ? (
						<HierarchyView data={results.hierarchy} />
					) : (
						/* Fallback to legacy flat view if hierarchy missing */
						<div className="space-y-3">
							<h3 className="text-sm font-medium flex items-center gap-2">
								<Tag className="h-4 w-4" /> Detected Topics (Flat)
							</h3>
							{(!results.topics || results.topics.length === 0) ? (
								<p className="text-sm text-muted-foreground">No topics detected.</p>
							) : (
								<div className="grid gap-3">
									{results.topics.map((topic, idx) => (
										<div key={idx} className="rounded border border-border p-4 space-y-2">
											<div className="flex items-start justify-between gap-4">
												<div className="flex-1">
													<h4 className="font-medium text-sm">{topic.topic_name}</h4>
													{topic.description && (
														<p className="text-xs text-muted-foreground mt-1">{topic.description}</p>
													)}
												</div>
												{typeof topic.confidence === "number" && (
													<div className="text-right">
														<div className="text-sm font-medium">
															{(topic.confidence * 100).toFixed(1)}%
														</div>
														<div className="text-xs text-muted-foreground">confidence</div>
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
