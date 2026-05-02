"use client";

import { useState } from "react";
import { Search, Loader2, XCircle, Tag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import HierarchyView from "./hierarchy-view";

type Topic = {
	topic_name: string;
	confidence?: number;
	keywords?: string[];
	description?: string;
};

type ResultsResponse = {
	content_id: number;
	content_type?: string;
	results: Topic[];
	hierarchy?: any; // Uses HierarchyView structure
	created_at?: string;
};

export default function TopicResults() {
	const [contentId, setContentId] = useState("");
	const [contentType, setContentType] = useState("news");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<ResultsResponse | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setData(null);
		setLoading(true);

		try {
			if (!contentId.trim()) throw new Error("Content ID is required");

			const response = await fetch(
				`/api/topic-analyzer/results/${contentId.trim()}?content_type=${contentType}`,
				{
					method: "GET",
					headers: { "Content-Type": "application/json" },
				}
			);

			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Failed to load results");

			setData(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2">
				<input
					type="number"
					value={contentId}
					onChange={(e) => setContentId(e.target.value)}
					placeholder="Content ID"
					className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
					disabled={loading}
				/>
				<select
					value={contentType}
					onChange={(e) => setContentType(e.target.value)}
					className="md:w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
					disabled={loading}
				>
					<option value="news">Online News</option>
					<option value="social_media">Social Media</option>
					<option value="print">Print Media</option>
					<option value="broadcast">Broadcast</option>
				</select>
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
				<div className="space-y-4">
					<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
								<p className="text-sm text-green-600 dark:text-green-400">
									Results loaded for ID {data.content_id}
								</p>
							</div>
							{data.created_at && (
								<div className="text-xs text-green-600 dark:text-green-400">
									Analyzed: {new Date(data.created_at).toLocaleString()}
								</div>
							)}
						</div>
					</div>

					{data.hierarchy ? (
						<HierarchyView data={data.hierarchy} />
					) : (
						/* Fallback legacy view */
						<>
							{!data.results || data.results.length === 0 ? (
								<div className="text-center py-8 text-sm text-muted-foreground">
									<p>No saved results found for content ID {data.content_id}.</p>
									<p className="mt-2">Try running a fresh analysis first.</p>
								</div>
							) : (
								<div className="space-y-3">
									<h3 className="text-sm font-medium flex items-center gap-2">
										<Tag className="h-4 w-4" /> Topics ({data.results.length})
									</h3>
									<div className="grid gap-3">
										{data.results.map((topic, idx) => (
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
								</div>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
}
